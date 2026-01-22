import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
const CreateRbac = () => {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [roleName, setroleName] = useState("");
  const [roleDescription, setroleDescription] = useState("");
  const [checkedItems, setCheckedItems] = useState([]);

  const userLoggedID = useDecodeToken();

  const CancelButton = () => {
    navigate("/settings/access-control");
    window.scrollTo(0, 0);
  };

  // console.log(userLoggedID);
  const selectAll = () => {
    const checkboxIds = [
      "Dashboard-View",
      "Invoices-View",
      "Invoices-Add",
      "Invoices-Edit",
      "Invoices-Delete",
      "Invoices-Approve",
      "Invoices-Print",
      "LocalCollections-View",
      "LocalCollections-Add",
      "LocalCollections-Edit",
      "LocalCollections-Delete",
      "LocalCollections-Approve",
      "OverseasCollections-View",
      "OverseasCollections-Add",
      "OverseasCollections-Edit",
      "OverseasCollections-Delete",
      "OverseasCollections-Approve",
      "Customers-View",
      "Customers-Add",
      "Customers-Edit",
      "OtherIncome-View",
      "OtherIncome-Add",
      "OtherIncome-Edit",
      "OtherIncome-Approve",
      "Payable-View",
      "Payable-Add",
      "Payable-Edit",
      "Payable-Delete",
      "Payable-Approve",
      "Payable-Print",
      "LocalPurchase-View",
      "LocalPurchase-Add",
      "LocalPurchase-Edit",
      "LocalPurchase-Delete",
      "LocalPurchase-Approve",
      "OverseasPurchase-View",
      "OverseasPurchase-Add",
      "OverseasPurchase-Edit",
      "OverseasPurchase-Delete",
      "OverseasPurchase-Approve",
      "Vendors-View",
      "Vendors-Add",
      "Vendors-Edit",
      "BankTransactions-View",
      // "BankTransactions-Delete",
      // "BankTransactions-IE",
      "OutstandingCheck-View",
      "OutstandingCheck-Add",
      "OutstandingCheck-Delete",
      // "OutstandingCheck-IE",
      "IssuedCheck-View",
      // "IssuedCheck-Delete",
      "AccountingList-View",
      "AccountingList-Add",
      "AccountingList-Edit",
      "AccountingList-Delete",
      "BankBudgeting-View",
      "StockManagement-View",
      "ProductList-View",
      "ProductList-Add",
      "ProductList-Edit",
      "Productions-View",
      "Productions-Add",
      "Productions-Edit",
      "Productions-Delete",
      "StockTransfer-View",
      "StockTransfer-Add",
      "InventoryCounting-View",
      "InventoryCounting-Add",
      "InventoryCounting-Edit",
      "InventoryCounting-IE",
      "InventoryCounting-Approve",
      "CashFlow-View",
      "Expenses-View",
      "Expenses-Add",
      "Expenses-Edit",
      "Expenses-Delete",
      "Expenses-Approved",
      "Expenses-Print",
      "LocalExpenses-View",
      "LocalExpenses-Add",
      "LocalExpenses-Edit",
      "LocalExpenses-Delete",
      "LocalExpenses-Approve",
      "OverseasExpenses-View",
      "OverseasExpenses-Add",
      "OverseasExpenses-Edit",
      "OverseasExpenses-Delete",
      "OverseasExpenses-Approve",
      "FixedAssets-View",
      "FixedAssets-Add",
      "FixedAssets-Edit",
      "FixedAssets-Delete",
      "FixedAssets-Approve",
      "Loan-View",
      "Loan-Add",
      "Loan-Edit",
      "Loan-Delete",
      "Loan-Approve",
      "AssetAccount-View",
      "AssetAccount-Add",
      "AssetAccount-Edit",
      "AssetAccount-Delete",
      "Liability-View",
      "Liability-Add",
      "Liability-Edit",
      "Liability-Delete",
      "Equity-View",
      "Equity-Add",
      "Equity-Edit",
      "Equity-Delete",
      "Monthly-View",
      "Monthly-Add",
      "Monthly-Edit",
      "Monthly-Delete",
      "Monthly-Approve",
      "Retained-View",
      "Retained-Add",
      "Retained-Edit",
      "Retained-Delete",
      "Reporting-View",
      "Reporting-IE",
      // "StatementReport-View",
      // "StatementReport-IE",
      // "AuditReports-View",
      // "AuditReports-IE",
      // "BusinessReport-View",
      // "BusinessReport-IE",
      // "InvReports-View",
      // "InvReports-IE",
      // "GenReports-View",
      // "GenReports-IE",
      "ExpensesType1-View",
      "ExpensesType1-Add",
      "ExpensesType1-Edit",
      "ExpensesType1-Delete",
      "ExpensesType2-View",
      "ExpensesType2-Add",
      "ExpensesType2-Edit",
      "ExpensesType2-Delete",
      // "LabelManagement-View",
      // "LabelManagement-Add",
      // "LabelManagement-Edit",
      // "LabelManagement-Delete",
      "RBAC-View",
      "RBAC-Add",
      "RBAC-Edit",
      "RBAC-Delete",
      "Branches-View",
      "Branches-Add",
      "Branches-Edit",
      "UserManagement-View",
      "UserManagement-Add",
      "UserManagement-Edit",
      "Currency-View",
      "Currency-Add",
      "Currency-Edit",
      "Notifications-View",
    ];
    const updatedCheckboxes = checkboxIds.map((value) => ({
      id: value,
    }));
    setCheckedItems(updatedCheckboxes);

    console.log(updatedCheckboxes);
  };

  const unSelectAll = () => {
    setCheckedItems([]);
  };

  const handleCheckboxChange = (event) => {
    const { id, checked } = event.target;
    let updatedItems;

    if (id === "Dashboard-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Dashboard-")
        );
      } else {
        // If checking Dashboard-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Invoices-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Invoices-")
        );
      } else {
        // If checking Invoices-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "LocalCollections-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("LocalCollections-")
        );
      } else {
        // If checking LocalCollections-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "OverseasCollections-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("OverseasCollections-")
        );
      } else {
        // If checking OverseasCollections-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Customers-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Customers-")
        );
      } else {
        // If checking Customers-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "OtherIncome-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("OtherIncome-")
        );
      } else {
        // If checking OtherIncome-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Payable-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Payable-")
        );
      } else {
        // If checking Payable-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "LocalPurchase-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("LocalPurchase-")
        );
      } else {
        // If checking LocalPurchase-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "OverseasPurchase-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("OverseasPurchase-")
        );
      } else {
        // If checking OverseasPurchase-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Vendors-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Vendors-")
        );
      } else {
        // If checking Vendors-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "BankTransactions-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("BankTransactions-")
        );
      } else {
        // If checking BankTransactions-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "OutstandingCheck-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("OutstandingCheck-")
        );
      } else {
        // If checking OutstandingCheck-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "IssuedCheck-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("IssuedCheck-")
        );
      } else {
        // If checking IssuedCheck-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "AccountingList-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("AccountingList-")
        );
      } else {
        // If checking AccountingList-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "BankBudgeting-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("BankBudgeting-")
        );
      } else {
        // If checking BankBudgeting-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "StockManagement-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("StockManagement-")
        );
      } else {
        // If checking StockManagement-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "ProductList-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("ProductList-")
        );
      } else {
        // If checking ProductList-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Productions-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Productions-")
        );
      } else {
        // If checking Productions-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "StockTransfer-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("StockTransfer-")
        );
      } else {
        // If checking StockTransfer-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "InventoryCounting-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("InventoryCounting-")
        );
      } else {
        // If checking InventoryCounting-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "CashFlow-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("CashFlow-")
        );
      } else {
        // If checking CashFlow-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Expenses-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Expenses-")
        );
      } else {
        // If checking Expenses-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "LocalExpenses-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("LocalExpenses-")
        );
      } else {
        // If checking LocalExpenses-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "OverseasExpenses-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("OverseasExpenses-")
        );
      } else {
        // If checking OverseasExpenses-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "FixedAssets-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("FixedAssets-")
        );
      } else {
        // If checking FixedAssets-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Loan-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Loan-")
        );
      } else {
        // If checking FixedAssets-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "AssetAccount-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("AssetAccount-")
        );
      } else {
        // If checking AssetAccount-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Liability-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Liability-")
        );
      } else {
        // If checking Liability-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Equity-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Equity-")
        );
      } else {
        // If checking Equity-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Monthly-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Monthly-")
        );
      } else {
        // If checking Monthly-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Retained-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Retained-")
        );
      } else {
        // If checking Retained-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
      // } else if (id === "StatementReport-View") {
      //   if (!checked) {
      //     updatedItems = checkedItems.filter(
      //       (item) => !item.id.startsWith("StatementReport-")
      //     );
      //   } else {
      //     // If checking StatementReport-View, just add it
      //     updatedItems = [...checkedItems, { id }];
      //   }
      // } else if (id === "AuditReports-View") {
      //   if (!checked) {
      //     updatedItems = checkedItems.filter(
      //       (item) => !item.id.startsWith("AuditReports-")
      //     );
      //   } else {
      //     // If checking AuditReports-View, just add it
      //     updatedItems = [...checkedItems, { id }];
      //   }
      // } else if (id === "BusinessReport-View") {
      //   if (!checked) {
      //     updatedItems = checkedItems.filter(
      //       (item) => !item.id.startsWith("BusinessReport-")
      //     );
      //   } else {
      //     // If checking BusinessReport-View, just add it
      //     updatedItems = [...checkedItems, { id }];
      //   }
      // } else if (id === "InvReports-View") {
      //   if (!checked) {
      //     updatedItems = checkedItems.filter(
      //       (item) => !item.id.startsWith("InvReports-")
      //     );
      //   } else {
      //     // If checking InvReports-View, just add it
      //     updatedItems = [...checkedItems, { id }];
      //   }
      // } else if (id === "GenReports-View") {
      //   if (!checked) {
      //     updatedItems = checkedItems.filter(
      //       (item) => !item.id.startsWith("GenReports-")
      //     );
      //   } else {
      //     // If checking GenReports-View, just add it
      //     updatedItems = [...checkedItems, { id }];
      //   }
      // }
    } else if (id === "Reporting-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Reporting-")
        );
      } else {
        // If checking Reporting-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "ExpensesType1-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("ExpensesType1-")
        );
      } else {
        // If checking ExpensesType1-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "ExpensesType2-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("ExpensesType2-")
        );
      } else {
        // If checking ExpensesType2-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "RBAC-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("RBAC-")
        );
      } else {
        // If checking RBAC-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Branches-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Branches-")
        );
      } else {
        // If checking Branches-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "UserManagement-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("UserManagement-")
        );
      } else {
        // If checking UserManagement-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Currency-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Currency-")
        );
      } else {
        // If checking Currency-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else if (id === "Notifications-View") {
      if (!checked) {
        updatedItems = checkedItems.filter(
          (item) => !item.id.startsWith("Notifications-")
        );
      } else {
        // If checking Notifications-View, just add it
        updatedItems = [...checkedItems, { id }];
      }
    } else {
      if (checkedItems.some((item) => item.id === id)) {
        // Remove the item from the checkedItems array
        updatedItems = checkedItems.filter((item) => item.id !== id);
      } else {
        // Add the new item to the checkedItems array
        updatedItems = [...checkedItems, { id }];
      }
    }

    setCheckedItems(updatedItems);
  };

  const add = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill the red text fields",
      });
    } else {
      if (checkedItems && checkedItems.length === 0) {
        swal({
          icon: "error",
          title: "Checkbox field required",
          text: "Please select at least one checkbox",
        });
        return;
      }
      swal({
        title: `Are you sure want to save this new role?`,
        text: "This action cannot be undo.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (approve) => {
        if (approve) {
          axios
            .post(`${BASE_URL}/userRole/createRbac`, {
              roleName,
              roleDescription,
              checkedItems,
              userLoggedID,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Role successfully created",
                  icon: "success",
                  button: "OK",
                }).then(() => {
                  navigate("/settings/access-control");
                });
              } else if (res.status === 202) {
                swal({
                  title: "Rolename already taken",
                  text: "Please input another name",
                  icon: "error",
                  button: "OK",
                });
              } else {
                swal({
                  icon: "error",
                  title: "Something went wrong",
                  text: "Please contact our support",
                });
              }
            });
        }
      });
    }
    setValidated(true); //for validations
  };
  return (
    <div className="w-100 border bg-white p-3 h-100">
      <div className="w-100 p-2 d-flex flex-row justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">
          <Link to="/settings/access-control" className="text-dark me-2">
            <i class="fa-solid fa-arrow-left"></i>
          </Link>
          Create RBAC
        </h2>
      </div>
      <Form noValidate validated={validated} onSubmit={add}>
        <div className="row p-3">
          <div className="col-md-6">
            <Form.Group controlId="roleName">
              <Form.Label>
                Access Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Role Name"
                onChange={(e) => setroleName(e.target.value)}
                required
              />
            </Form.Group>
          </div>
          <div className="col-md-6">
            <Form.Group controlId="description">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                placeholder="Description"
                onChange={(e) => setroleDescription(e.target.value)}
              />
            </Form.Group>
          </div>
        </div>

        <div className="d-flex justify-content-end p-3">
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={selectAll}
          >
            Select All
          </Button>
          <Button variant="outline-danger" onClick={unSelectAll}>
            Unselect All
          </Button>
        </div>

        <div className="w-100 p-3">
          <table
            className="role-table-lists w-100"
            style={{ maxHeight: "150px", overflowY: "auto" }}
          >
            <thead>
              <tr>
                <th>Module Name</th>
                <th>View</th>
                <th>Add</th>
                <th>Update</th>
                <th>Delete/Archive</th>
                <th>Import/Export</th>
                <th>Approval</th>
                <th>Print</th>
              </tr>
            </thead>
            <tbody>
              {/* DASHBOARD */}
              <tr>
                <td className="module-title" colSpan={8}>
                  DASHBOARD
                </td>
              </tr>
              <tr className="tr-role">
                <td className="sub-module-title">Dashboard</td>
                <td>
                  <input
                    id="Dashboard-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Dashboard-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Dashboard-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Dashboard-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Dashboard-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Dashboard-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Dashboard-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Dashboard-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Dashboard-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Dashboard-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Dashboard-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Dashboard-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Dashboard-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Dashboard-Approve"
                    )}
                  />
                </td>
              </tr>
              {/* DASHBOARD */}

              {/* SALES */}
              <tr>
                <td className="module-title" colSpan={8}>
                  SALES
                </td>
              </tr>

              {/* INVOICES */}
              <tr className="tr-role">
                <td className="sub-module-title">Invoices</td>
                <td>
                  <input
                    id="Invoices-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Invoices-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Invoices-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Invoices-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Invoices-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Invoices-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Invoices-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Invoices-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Invoices-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Invoices-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Invoices-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Invoices-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Invoices-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Invoices-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Invoices-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Invoices-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Invoices-Print"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Invoices-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Invoices-Print"
                    )}
                  />
                </td>
              </tr>
              {/* INVOICES */}

              {/* LOCAL COLLECTIONS */}
              <tr className="tr-role">
                <td className="sub-module-title">Local Collections</td>
                <td>
                  <input
                    id="LocalCollections-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalCollections-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalCollections-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalCollections-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalCollections-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalCollections-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalCollections-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalCollections-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalCollections-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalCollections-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalCollections-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalCollections-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalCollections-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalCollections-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalCollections-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalCollections-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalCollections-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalCollections-Print"
                    )}
                  />
                </td>
              </tr>
              {/* LOCAL COLLECTIONS */}

              {/* OVERSEAS COLLECTIONS */}
              <tr className="tr-role">
                <td className="sub-module-title">Overseas Collections</td>
                <td>
                  <input
                    id="OverseasCollections-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasCollections-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasCollections-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasCollections-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasCollections-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasCollections-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasCollections-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasCollections-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasCollections-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasCollections-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasCollections-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasCollections-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasCollections-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasCollections-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasCollections-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasCollections-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasCollections-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasCollections-Print"
                    )}
                  />
                </td>
              </tr>
              {/* OVERSEAS COLLECTIONS */}

              {/* CUSTOMERS */}
              <tr className="tr-role">
                <td className="sub-module-title">Customers</td>
                <td>
                  <input
                    id="Customers-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Customers-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Customers-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Customers-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Customers-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Customers-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Customers-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Customers-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Customers-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Customers-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Customers-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Customers-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Customers-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Customers-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Customers-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Customers-Print"
                    )}
                  />
                </td>
              </tr>
              {/* CUSTOMERS */}

              {/* OTHER INCOME */}
              {/* <tr className="tr-role">
                <td className="sub-module-title">Other Income</td>
                <td>
                  <input
                    id="OtherIncome-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OtherIncome-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OtherIncome-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OtherIncome-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-Print"
                    )}
                  />
                </td>
              </tr> */}
              {/* OTHER INCOME */}
              {/* SALES */}

              {/* PURCHASES */}
              <tr>
                <td className="module-title" colSpan={8}>
                  PURCHASES
                </td>
              </tr>

              {/* PAYABLE */}
              <tr className="tr-role">
                <td className="sub-module-title">Payable</td>
                <td>
                  <input
                    id="Payable-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Payable-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Payable-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Payable-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Payable-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Payable-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Payable-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Payable-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Payable-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Payable-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Payable-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Payable-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Payable-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Payable-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Payable-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Payable-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Payable-Print"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Payable-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Payable-Print"
                    )}
                  />
                </td>
              </tr>
              {/* PAYABLE */}

              {/* LOCAL PURCHASE */}
              <tr className="tr-role">
                <td className="sub-module-title">Local Purchase</td>
                <td>
                  <input
                    id="LocalPurchase-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalPurchase-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalPurchase-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalPurchase-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalPurchase-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalPurchase-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalPurchase-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalPurchase-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalPurchase-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalPurchase-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalPurchase-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalPurchase-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalPurchase-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalPurchase-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalPurchase-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalPurchase-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalPurchase-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalPurchase-Print"
                    )}
                  />
                </td>
              </tr>
              {/* LOCAL PURCHASE */}

              {/* OVERSEAS PURCHASE */}
              <tr className="tr-role">
                <td className="sub-module-title">Overseas Purchase</td>
                <td>
                  <input
                    id="OverseasPurchase-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasPurchase-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasPurchase-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasPurchase-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasPurchase-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasPurchase-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasPurchase-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasPurchase-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasPurchase-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasPurchase-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasPurchase-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasPurchase-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasPurchase-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasPurchase-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasPurchase-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasPurchase-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasPurchase-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasPurchase-Print"
                    )}
                  />
                </td>
              </tr>
              {/* OVERSEAS PURCHASE */}

              {/* VENDORS */}
              <tr className="tr-role">
                <td className="sub-module-title">Vendors</td>
                <td>
                  <input
                    id="Vendors-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Vendors-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Vendors-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Vendors-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Vendors-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Vendors-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Vendors-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Vendors-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Vendors-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Vendors-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Vendors-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Vendors-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Vendors-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Vendors-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Vendors-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Vendors-Print"
                    )}
                  />
                </td>
              </tr>
              {/* VENDORS */}
              {/* PURCHASES */}

              {/* ACCOUNTS */}
              <tr>
                <td className="module-title" colSpan={8}>
                  ACCOUNTS
                </td>
              </tr>
              {/* BANK TRANSACTIONS */}
              <tr className="tr-role">
                <td className="sub-module-title">Bank Transactions</td>
                <td>
                  <input
                    id="BankTransactions-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankTransactions-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankTransactions-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankTransactions-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankTransactions-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankTransactions-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankTransactions-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankTransactions-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankTransactions-IE"
                    type="checkbox"
                    // disabled={
                    //   !checkedItems.some(
                    //     (item) => item.id === "BankTransactions-View"
                    //   )
                    // }
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankTransactions-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankTransactions-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankTransactions-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankTransactions-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankTransactions-Print"
                    )}
                  />
                </td>
              </tr>
              {/* BANK TRANSACTIONS */}

              {/* OUTSTANDING CHECK */}
              <tr className="tr-role">
                <td className="sub-module-title">Receivable Checks</td>
                <td>
                  <input
                    id="OutstandingCheck-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OutstandingCheck-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OutstandingCheck-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OutstandingCheck-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OutstandingCheck-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OutstandingCheck-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OutstandingCheck-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OutstandingCheck-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OutstandingCheck-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OutstandingCheck-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OutstandingCheck-IE"
                    type="checkbox"
                    // disabled={
                    //   !checkedItems.some(
                    //     (item) => item.id === "OutstandingCheck-View"
                    //   )
                    // }
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OutstandingCheck-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OutstandingCheck-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OutstandingCheck-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OutstandingCheck-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OutstandingCheck-Print"
                    )}
                  />
                </td>
              </tr>
              {/* OUTSTANDING CHECK */}

              {/* ISSUED CHECK ACCOUNT */}
              <tr className="tr-role">
                <td className="sub-module-title">Issued Check Account</td>
                <td>
                  <input
                    id="IssuedCheck-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "IssuedCheck-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="IssuedCheck-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "IssuedCheck-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="IssuedCheck-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "IssuedCheck-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="IssuedCheck-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "IssuedCheck-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="IssuedCheck-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "IssuedCheck-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="IssuedCheck-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "IssuedCheck-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="IssuedCheck-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "IssuedCheck-Print"
                    )}
                  />
                </td>
              </tr>
              {/* ISSUED CHECK ACCOUNT */}

              {/* ACCOUNTING LIST */}
              <tr className="tr-role">
                <td className="sub-module-title">Accounting List</td>
                <td>
                  <input
                    id="AccountingList-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AccountingList-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AccountingList-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "AccountingList-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AccountingList-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AccountingList-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "AccountingList-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AccountingList-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AccountingList-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "AccountingList-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AccountingList-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AccountingList-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AccountingList-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AccountingList-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AccountingList-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AccountingList-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AccountingList-Print"
                    )}
                  />
                </td>
              </tr>
              {/* ACCOUNTING LIST */}

              {/* BANK BUDGETING */}
              <tr className="tr-role">
                <td className="sub-module-title">Bank Budgeting</td>
                <td>
                  <input
                    id="BankBudgeting-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankBudgeting-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankBudgeting-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankBudgeting-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankBudgeting-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankBudgeting-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankBudgeting-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankBudgeting-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankBudgeting-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankBudgeting-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankBudgeting-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankBudgeting-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BankBudgeting-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BankBudgeting-Print"
                    )}
                  />
                </td>
              </tr>
              {/* BANK BUDGETING */}

              {/* OTHER INCOME */}
              <tr className="tr-role">
                <td className="sub-module-title">Other Income</td>
                <td>
                  <input
                    id="OtherIncome-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OtherIncome-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OtherIncome-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OtherIncome-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OtherIncome-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OtherIncome-Print"
                    )}
                  />
                </td>
              </tr>
              {/* OTHER INCOME */}
              {/* ACCOUNTS */}

              {/* INVENTORY */}
              <tr>
                <td className="module-title" colSpan={7}>
                  INVENTORY
                </td>
              </tr>
              {/* STOCK MANAGEMENT */}
              <tr className="tr-role">
                <td className="sub-module-title">Stock Management</td>
                <td>
                  <input
                    id="StockManagement-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StockManagement-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StockManagement-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StockManagement-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StockManagement-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StockManagement-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StockManagement-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StockManagement-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StockManagement-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StockManagement-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StockManagement-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StockManagement-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StockManagement-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StockManagement-Print"
                    )}
                  />
                </td>
              </tr>
              {/* STOCK MANAGEMENT */}

              {/* PRODUCT LIST */}
              <tr className="tr-role">
                <td className="sub-module-title">Product List</td>
                <td>
                  <input
                    id="ProductList-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ProductList-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ProductList-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "ProductList-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ProductList-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ProductList-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "ProductList-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ProductList-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ProductList-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ProductList-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ProductList-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ProductList-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ProductList-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ProductList-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ProductList-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ProductList-Print"
                    )}
                  />
                </td>
              </tr>
              {/* PRODUCT LIST */}

              {/* RECEIVING */}
              {/* <tr className="tr-role">
                <td className="sub-module-title">Receiving</td>
                <td>
                  <input
                    id="Receiving-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Receiving-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Receiving-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Receiving-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Receiving-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Receiving-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Receiving-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Receiving-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Receiving-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Receiving-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Receiving-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Receiving-Approve"
                    )}
                  />
                </td>
              </tr> */}
              {/* RECEIVING */}

              {/* PRODUCTIONS */}
              <tr className="tr-role">
                <td className="sub-module-title">Productions</td>
                <td>
                  <input
                    id="Productions-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Productions-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Productions-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "Productions-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Productions-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Productions-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "Productions-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Productions-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Productions-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "Productions-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Productions-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Productions-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Productions-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Productions-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Productions-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Productions-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Productions-Print"
                    )}
                  />
                </td>
              </tr>
              {/* PRODUCTIONS */}

              {/* STOCK TRANSFER */}
              {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
                <tr className="tr-role">
                  <td className="sub-module-title">Stock Transfer</td>
                  <td>
                    <input
                      id="StockTransfer-View"
                      type="checkbox"
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "StockTransfer-View"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="StockTransfer-Add"
                      type="checkbox"
                      disabled={
                        !checkedItems.some(
                          (item) => item.id === "StockTransfer-View"
                        )
                      }
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "StockTransfer-Add"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="StockTransfer-Edit"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "StockTransfer-Edit"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="StockTransfer-Delete"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "StockTransfer-Delete"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="StockTransfer-IE"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "StockTransfer-IE"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="StockTransfer-Approve"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "StockTransfer-Approve"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="StockTransfer-Print"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "StockTransfer-Print"
                      )}
                    />
                  </td>
                </tr>
              )}

              {/* STOCK TRANSFER */}

              {/* INVENTORY COUNTING */}
              <tr className="tr-role">
                <td className="sub-module-title">Inventory Counting</td>
                <td>
                  <input
                    id="InventoryCounting-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InventoryCounting-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InventoryCounting-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "InventoryCounting-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InventoryCounting-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InventoryCounting-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "InventoryCounting-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InventoryCounting-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InventoryCounting-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InventoryCounting-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InventoryCounting-IE"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "InventoryCounting-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InventoryCounting-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InventoryCounting-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "InventoryCounting-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InventoryCounting-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InventoryCounting-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InventoryCounting-Print"
                    )}
                  />
                </td>
              </tr>
              {/* INVENTORY COUNTING */}
              {/* INVENTORY */}

              {/* ACCOUNTING */}
              <tr>
                <td className="module-title" colSpan={8}>
                  ACCOUNTING
                </td>
              </tr>

              {/* CASH FLOW */}
              <tr className="tr-role">
                <td className="sub-module-title">Cash Flow</td>
                <td>
                  <input
                    id="CashFlow-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "CashFlow-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="CashFlow-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "CashFlow-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="CashFlow-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "CashFlow-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="CashFlow-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "CashFlow-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="CashFlow-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "CashFlow-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="CashFlow-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "CashFlow-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="CashFlow-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "CashFlow-Print"
                    )}
                  />
                </td>
              </tr>
              {/* CASH FLOW */}

              {/* EXPENSES */}
              <tr className="tr-role">
                <td className="sub-module-title">Expenses</td>
                <td>
                  <input
                    id="Expenses-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Expenses-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Expenses-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Expenses-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Expenses-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Expenses-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Expenses-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Expenses-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Expenses-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Expenses-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Expenses-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Expenses-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Expenses-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Expenses-Approved"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Expenses-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Expenses-Approved"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Expenses-Print"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Expenses-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Expenses-Print"
                    )}
                  />
                </td>
              </tr>
              {/* EXPENSES */}

              {/* LOCAL EXPENSES */}
              <tr className="tr-role">
                <td className="sub-module-title">Local Expenses</td>
                <td>
                  <input
                    id="LocalExpenses-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalExpenses-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalExpenses-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalExpenses-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalExpenses-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalExpenses-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalExpenses-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalExpenses-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalExpenses-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalExpenses-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalExpenses-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalExpenses-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalExpenses-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalExpenses-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LocalExpenses-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalExpenses-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LocalExpenses-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LocalExpenses-Print"
                    )}
                  />
                </td>
              </tr>
              {/* LOCAL EXPENSES */}

              {/* OVERSEAS EXPENSES */}
              <tr className="tr-role">
                <td className="sub-module-title">Overseas Expenses</td>
                <td>
                  <input
                    id="OverseasExpenses-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasExpenses-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasExpenses-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasExpenses-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasExpenses-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasExpenses-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasExpenses-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasExpenses-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasExpenses-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasExpenses-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasExpenses-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasExpenses-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasExpenses-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasExpenses-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "OverseasExpenses-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasExpenses-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="OverseasExpenses-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "OverseasExpenses-Print"
                    )}
                  />
                </td>
              </tr>
              {/* OVERSEAS EXPENSES */}

              {/* FIXED ASSETS */}
              <tr className="tr-role">
                <td className="sub-module-title">Fixed Assets</td>
                <td>
                  <input
                    id="FixedAssets-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "FixedAssets-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="FixedAssets-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "FixedAssets-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "FixedAssets-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="FixedAssets-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "FixedAssets-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "FixedAssets-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="FixedAssets-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "FixedAssets-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "FixedAssets-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="FixedAssets-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "FixedAssets-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="FixedAssets-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "FixedAssets-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "FixedAssets-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="FixedAssets-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "FixedAssets-Print"
                    )}
                  />
                </td>
              </tr>
              {/* FIXED ASSETS */}

              {/* Loan Management */}
              {/* <tr className="tr-role">
                <td className="sub-module-title">Loan Management</td>
                <td>
                  <input
                    id="Loan-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Loan-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Loan-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Loan-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Loan-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Loan-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Loan-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Loan-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Loan-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Loan-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Loan-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Loan-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some((item) => item.id === "Loan-IE")}
                  />
                </td>
                <td>
                  <input
                    id="Loan-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Loan-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Loan-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Loan-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Loan-Print"
                    )}
                  />
                </td>
              </tr> */}
              {/* FIXED ASSETS */}

              {/* ASSET ACCOUNT */}
              <tr className="tr-role">
                <td className="sub-module-title">Asset Account</td>
                <td>
                  <input
                    id="AssetAccount-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AssetAccount-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AssetAccount-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "AssetAccount-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AssetAccount-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AssetAccount-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "AssetAccount-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AssetAccount-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AssetAccount-Delete"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "AssetAccount-View"
                      )
                    }
                    checked={checkedItems.some(
                      (item) => item.id === "AssetAccount-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AssetAccount-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AssetAccount-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AssetAccount-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AssetAccount-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AssetAccount-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AssetAccount-Print"
                    )}
                  />
                </td>
              </tr>
              {/* ASSET ACCOUNT */}

              {/* LIABILITY ACCOUNT */}
              <tr className="tr-role">
                <td className="sub-module-title">Liability</td>
                <td>
                  <input
                    id="Liability-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Liability-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Liability-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Liability-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Liability-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Liability-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Liability-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Liability-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Liability-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Liability-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Liability-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Liability-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Liability-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Liability-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Liability-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Liability-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Liability-Print"
                    )}
                  />
                </td>
              </tr>
              {/* LIABILITY ACCOUNT */}

              {/* OWNERS EQUITY */}
              <tr className="tr-role">
                <td className="sub-module-title">Owners' Equity</td>
                <td>
                  <input
                    id="Equity-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Equity-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Equity-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Equity-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Equity-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Equity-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Equity-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Equity-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Equity-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Equity-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Equity-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Equity-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Equity-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Equity-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Equity-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Equity-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Equity-Print"
                    )}
                  />
                </td>
              </tr>
              {/* OWNERS EQUITY */}

              {/* MONTHLY CUTOFF */}
              <tr className="tr-role">
                <td className="sub-module-title">Monthly Cutoff</td>
                <td>
                  <input
                    id="Monthly-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Monthly-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Monthly-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Monthly-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Monthly-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Monthly-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Monthly-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Monthly-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Monthly-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Monthly-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Monthly-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Monthly-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Monthly-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Monthly-Approve"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Monthly-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Monthly-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Monthly-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Monthly-Print"
                    )}
                  />
                </td>
              </tr>
              {/* MONTHLY CUTOFF */}

              {/* RETAINED EARNINGS */}
              <tr className="tr-role">
                <td className="sub-module-title">Retained Earnings</td>
                <td>
                  <input
                    id="Retained-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Retained-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Retained-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Retained-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Retained-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Retained-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Retained-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Retained-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Retained-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Retained-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Retained-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Retained-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Retained-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Retained-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Retained-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Retained-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Retained-Print"
                    )}
                  />
                </td>
              </tr>
              {/* RETAINED EARNINGS */}
              {/* ACCOUNTING */}

              {/* REPORTING */}
              <tr>
                <td className="module-title" colSpan={8}>
                  REPORTING
                </td>
              </tr>
              <tr className="tr-role">
                <td className="sub-module-title">Reports</td>
                <td>
                  <input
                    id="Reporting-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Reporting-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Reporting-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Reporting-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Reporting-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Reporting-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Reporting-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Reporting-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Reporting-IE"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "Reporting-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Reporting-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Reporting-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Reporting-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Reporting-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Reporting-Print"
                    )}
                  />
                </td>
              </tr>
              {/* STATEMENT REPORT */}
              {/* <tr className="tr-role">
                <td className="sub-module-title">Statement Reports</td>
                <td>
                  <input
                    id="StatementReport-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StatementReport-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StatementReport-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StatementReport-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StatementReport-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StatementReport-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StatementReport-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StatementReport-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StatementReport-IE"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "StatementReport-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StatementReport-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="StatementReport-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "StatementReport-Approve"
                    )}
                  />
                </td>
              </tr> */}
              {/* STATEMENT REPORT */}

              {/* AUDIT REPORT */}
              {/* <tr className="tr-role">
                <td className="sub-module-title">Audit Reports</td>
                <td>
                  <input
                    id="AuditReports-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AuditReports-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AuditReports-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AuditReports-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AuditReports-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AuditReports-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AuditReports-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AuditReports-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AuditReports-IE"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "AuditReports-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AuditReports-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="AuditReports-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "AuditReports-Approve"
                    )}
                  />
                </td>
              </tr> */}
              {/* AUDIT REPORT */}

              {/* BUSINESS PARTNER REPORTS */}
              {/* <tr className="tr-role">
                <td className="sub-module-title">Business Partner Reports</td>
                <td>
                  <input
                    id="BusinessReport-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BusinessReport-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BusinessReport-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BusinessReport-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BusinessReport-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BusinessReport-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BusinessReport-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BusinessReport-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BusinessReport-IE"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "BusinessReport-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BusinessReport-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="BusinessReport-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "BusinessReport-Approve"
                    )}
                  />
                </td>
              </tr> */}
              {/* BUSINESS PARTNER REPORTS */}

              {/* INVENTORY REPORTS */}
              {/* <tr className="tr-role">
                <td className="sub-module-title">Inventory Reports</td>
                <td>
                  <input
                    id="InvReports-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InvReports-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InvReports-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InvReports-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InvReports-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InvReports-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InvReports-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InvReports-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InvReports-IE"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "InvReports-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InvReports-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="InvReports-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "InvReports-Approve"
                    )}
                  />
                </td>
              </tr> */}
              {/* INVENTORY REPORTS */}

              {/* GENERAL REPORTS */}
              {/* <tr className="tr-role">
                <td className="sub-module-title">General Reports</td>
                <td>
                  <input
                    id="GenReports-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "GenReports-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="GenReports-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "GenReports-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="GenReports-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "GenReports-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="GenReports-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "GenReports-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="GenReports-IE"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "GenReports-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "GenReports-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="GenReports-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "GenReports-Approve"
                    )}
                  />
                </td>
              </tr> */}
              {/* GENERAL REPORTS */}
              {/* REPORTING */}

              {/* CONTENT MANAGEMENT */}
              <tr>
                <td className="module-title" colSpan={8}>
                  CONTENT MANAGEMENT
                </td>
              </tr>

              {/* EXPENSES TYPE 1 */}
              <tr className="tr-role">
                <td className="sub-module-title">Expenses Type 1</td>
                <td>
                  <input
                    id="ExpensesType1-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType1-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType1-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "ExpensesType1-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType1-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType1-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "ExpensesType1-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType1-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType1-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "ExpensesType1-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType1-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType1-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType1-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType1-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType1-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType1-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType1-Print"
                    )}
                  />
                </td>
              </tr>
              {/* EXPENSES TYPE 1 */}

              {/* EXPENSES TYPE 2 */}
              <tr className="tr-role">
                <td className="sub-module-title">Expenses Type 2</td>
                <td>
                  <input
                    id="ExpensesType2-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType2-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType2-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "ExpensesType2-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType2-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType2-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "ExpensesType2-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType2-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType2-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "ExpensesType2-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType2-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType2-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType2-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType2-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType2-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="ExpensesType2-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "ExpensesType2-Print"
                    )}
                  />
                </td>
              </tr>
              {/* EXPENSES TYPE 2 */}

              {/* LABEL MANAGEMENT */}
              {/* <tr className="tr-role">
                <td className="sub-module-title">Label Management</td>
                <td>
                  <input
                    id="LabelManagement-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LabelManagement-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LabelManagement-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LabelManagement-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LabelManagement-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LabelManagement-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LabelManagement-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LabelManagement-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LabelManagement-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "LabelManagement-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LabelManagement-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LabelManagement-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LabelManagement-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="LabelManagement-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "LabelManagement-Approve"
                    )}
                  />
                </td>
              </tr> */}
              {/* LABEL MANAGEMENT */}
              {/* CONTENT MANAGEMENT */}

              {/* SETTINGS */}
              <tr>
                <td className="module-title" colSpan={7}>
                  SETTINGS
                </td>
              </tr>
              {/* RBAC */}
              <tr className="tr-role">
                <td className="sub-module-title">Access Control</td>
                <td>
                  <input
                    id="RBAC-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "RBAC-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="RBAC-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "RBAC-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "RBAC-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="RBAC-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "RBAC-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "RBAC-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="RBAC-Delete"
                    type="checkbox"
                    disabled={
                      !checkedItems.some((item) => item.id === "RBAC-View")
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "RBAC-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="RBAC-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some((item) => item.id === "RBAC-IE")}
                  />
                </td>
                <td>
                  <input
                    id="RBAC-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "RBAC-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="RBAC-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "RBAC-Print"
                    )}
                  />
                </td>
              </tr>
              {/* RBAC */}

              {/* BRANCHES */}
              {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
                <tr className="tr-role">
                  <td className="sub-module-title">Branches</td>
                  <td>
                    <input
                      id="Branches-View"
                      type="checkbox"
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Branches-View"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Branches-Add"
                      type="checkbox"
                      disabled={
                        !checkedItems.some(
                          (item) => item.id === "Branches-View"
                        )
                      }
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Branches-Add"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Branches-Edit"
                      type="checkbox"
                      disabled={
                        !checkedItems.some(
                          (item) => item.id === "Branches-View"
                        )
                      }
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Branches-Edit"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Branches-Delete"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Branches-Delete"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Branches-IE"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Branches-IE"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Branches-Approve"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Branches-Approve"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Branches-Print"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Branches-Print"
                      )}
                    />
                  </td>
                </tr>
              )}
              {/* BRANCHES */}

              {/* USER MANAGEMENT */}
              <tr className="tr-role">
                <td className="sub-module-title">User Management</td>
                <td>
                  <input
                    id="UserManagement-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "UserManagement-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="UserManagement-Add"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "UserManagement-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "UserManagement-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="UserManagement-Edit"
                    type="checkbox"
                    disabled={
                      !checkedItems.some(
                        (item) => item.id === "UserManagement-View"
                      )
                    }
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "UserManagement-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="UserManagement-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "UserManagement-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="UserManagement-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "UserManagement-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="UserManagement-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "UserManagement-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="UserManagement-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "UserManagement-Print"
                    )}
                  />
                </td>
              </tr>
              {/* USER MANAGEMENT */}

              {/* CURRENCY */}
              {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
                <tr className="tr-role">
                  <td className="sub-module-title">Currency</td>
                  <td>
                    <input
                      id="Currency-View"
                      type="checkbox"
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Currency-View"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Currency-Add"
                      type="checkbox"
                      disabled={
                        !checkedItems.some(
                          (item) => item.id === "Currency-View"
                        )
                      }
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Currency-Add"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Currency-Edit"
                      type="checkbox"
                      disabled={
                        !checkedItems.some(
                          (item) => item.id === "Currency-View"
                        )
                      }
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Currency-Edit"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Currency-Delete"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Currency-Delete"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Currency-IE"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Currency-IE"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Currency-Approve"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Currency-Approve"
                      )}
                    />
                  </td>
                  <td>
                    <input
                      id="Currency-Print"
                      type="checkbox"
                      disabled
                      onChange={handleCheckboxChange}
                      checked={checkedItems.some(
                        (item) => item.id === "Currency-Print"
                      )}
                    />
                  </td>
                </tr>
              )}
              {/* CURRENCY */}

              {/* IN APP NOTIFICATIONS */}
              <tr className="tr-role">
                <td className="sub-module-title">In APP Notifications</td>
                <td>
                  <input
                    id="Notifications-View"
                    type="checkbox"
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Notifications-View"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Notifications-Add"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Notifications-Add"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Notifications-Edit"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Notifications-Edit"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Notifications-Delete"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Notifications-Delete"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Notifications-IE"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Notifications-IE"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Notifications-Approve"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Notifications-Approve"
                    )}
                  />
                </td>
                <td>
                  <input
                    id="Notifications-Print"
                    type="checkbox"
                    disabled
                    onChange={handleCheckboxChange}
                    checked={checkedItems.some(
                      (item) => item.id === "Notifications-Print"
                    )}
                  />
                </td>
              </tr>
              {/* IN APP NOTIFICATIONS */}
              {/* SETTINGS */}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-end">
          <Button
            variant="secondary"
            className="me-2"
            type="button"
            onClick={CancelButton}
          >
            Cancel
          </Button>
          <Button variant="success" type="submit">
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CreateRbac;
