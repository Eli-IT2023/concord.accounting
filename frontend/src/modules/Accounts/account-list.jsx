import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Plus, FadersHorizontal, MagnifyingGlass } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
const AccountList = ({ authrztn, roleType }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [validated, setValidated] = useState(false);
  const [accountListData, setAccountListData] = useState([]);
  const [accountType, setAccountType] = useState("Bank");
  const [currencyData, setCurrencyData] = useState([]);
  const [userData, setUserData] = useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredAccountListData = accountListData.filter((item) => {
    const accountType = item.account_type?.toLowerCase() ?? "";
    const accountName = item.account_name?.toLowerCase() ?? "";
    const bankName = item.bank_name?.toLowerCase() ?? "";
    const description = item.description?.toLowerCase() ?? "";
    const accountHolder = `${item.masterlist?.fname ?? ""} ${
      item.masterlist?.mname ?? ""
    } ${item.masterlist?.lname ?? ""}`.toLowerCase();
    const currency = item.currency?.based_currency?.toLowerCase() ?? "";
    const balance = item.bank_amount?.toString() ?? "";

    return (
      accountType.includes(searchQuery.toLowerCase()) ||
      accountName.includes(searchQuery.toLowerCase()) ||
      bankName.includes(searchQuery.toLowerCase()) ||
      description.includes(searchQuery.toLowerCase()) ||
      accountHolder.includes(searchQuery.toLowerCase()) ||
      currency.includes(searchQuery.toLowerCase()) ||
      balance.includes(searchQuery.toLowerCase())
    );
  });

  const fetchAccountData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/accountList/getAccountListData`);
      setAccountListData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const reloadTable = () => {
    axios.get(BASE_URL + "/currency/fetchCurrency").then((res) => {
      setCurrencyData(res.data);
    });
  };

  const reloadUserTable = async () => {
    await axios
      .get(BASE_URL + "/masterList/fetchTable")
      .then((response) => {
        setUserData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  useEffect(() => {
    reloadTable();
    reloadUserTable();
    fetchAccountData();
  }, []);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const handleShowAddAccount = () => setShowAddAccount(true);
  const handleCloseAddAccount = () => {
    setShowAddAccount(false);
    reset();
  };
  const handleAccountTypeChange = (event) => {
    setAccountType(event.target.value);
  };

  const addAccountList = async (data) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/accountList/createAccountList`,
        {
          ...data,
          accountType: accountType,
        }
      );

      if (response.status === 200) {
        swal({
          title: "Success",
          text: "Account created successfully",
          icon: "success",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        }).then(() => {
          handleCloseAddAccount();
          fetchAccountData();
        });
      } else if (response.status === 201) {
        swal({
          title: "Account already exists",
          text: "Please input another account",
          icon: "error",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        });
      } else {
        swal({
          title: "Something Went Wrong",
          text: "Please contact your support immediately",
          icon: "error",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        }).then(() => {
          handleCloseAddAccount();
        });
      }
    } catch (error) {
      swal({
        title: "Something Went Wrong",
        text: "Please contact your support immediately",
        icon: "error",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      });
    }
  };
  // const addAccountList = async (e) => {
  //   e.preventDefault();
  //   const form = e.currentTarget;
  //   if (form.checkValidity() === false) {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     swal({
  //       icon: "error",
  //       title: "Fields are required",
  //       text: "Please fill in the red text fields.",
  //     });
  //   } else {
  //     const formData = new FormData(form);
  //     formData.append("accountType", accountType);
  //     const data = Object.fromEntries(formData.entries());
  //     axios
  //       .post(`${BASE_URL}/accountList/createAccountList`, data)
  //       .then((res) => {
  //         if (res.status === 200) {
  //           swal({
  //             title: "Success",
  //             text: "Account created successfully",
  //             icon: "success",
  //             buttons: false,
  //             timer: 2000,
  //             dangerMode: true,
  //           }).then(() => {
  //             handleCloseAddAccount();
  //             setValidated(false);
  //             fetchAccountData();
  //           });
  //         } else if (res.status === 201) {
  //           swal({
  //             title: "Account already exist",
  //             text: "Please input another account",
  //             icon: "error",
  //             buttons: false,
  //             timer: 2000,
  //             dangerMode: true,
  //           });
  //         } else {
  //           swal({
  //             title: "Something Went Wrong",
  //             text: "Please contact your support immediately",
  //             icon: "error",
  //             buttons: false,
  //             timer: 2000,
  //             dangerMode: true,
  //           }).then(() => {
  //             handleCloseAddAccount();
  //           });
  //         }
  //       });
  //   }
  //   setValidated(true);
  // };

  const AccountListcolumns = [
    {
      name: "ACCOUNT TYPE",
      selector: (row) => row.account_type,
    },
    {
      name: "ACCOUNT NAME",
      selector: (row) => row.account_name,
    },
    {
      name: "BANK",
      selector: (row) => row.bank_name,
    },
    {
      name: "ACCOUNT HOLDER",
      selector: (row) => {
        if (row.masterlist) {
          const fullName = `${row.masterlist.fname || ""} ${
            row.masterlist.mname || ""
          } ${row.masterlist.lname || ""}`.trim();
          return fullName || row.account_name;
        } else {
          return row.account_name;
        }
      },
    },
    {
      name: "CURRENCY",
      selector: (row) => row.currency.based_currency,
    },
    {
      name: "BALANCE",
      selector: (row) =>
        row.bank_amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
  ];

  const handleViewAccountList = (row) => {
    navigate(`/Accounts/view-account-list/${row.account_list_id}`);
  };

  return (
    <>
      <div className="h-100 w-100 border bg-white custom-container">
        <div className="w-100 p-2 d-flex flex-row justify-content-between">
          <div className="d-flex flex-column title-custom">
            <span className="fs-3">Bank Account</span>
          </div>
          <div>
            <Link
              to="/accounts/account-list1"
              className="btn btn-primary d-flex flex-row align-items-center title-button"
            >
              Go to Account List
            </Link>
          </div>
          <div>
            <button className="btn btn-primary" onClick={handleShowAddAccount}>
              <Plus size={32} color="#f2f2f2" /> Account
            </button>
          </div>
        </div>
        <div className="w-100 row mx-auto mt-4"></div>

        <div className="w-100 mt-4 container-fluid">
          <div className="input-group">
            <span className="input-group-text bg-body" id="basic-addon2">
              <MagnifyingGlass size={20} color="#969696" />
            </span>
            <input
              type="text"
              className="form-control p-2"
              placeholder="Search"
              onChange={handleSearchChange}
            />
            <span className="input-group-text bg-body" id="basic-addon2">
              <FadersHorizontal size={32} />
            </span>
          </div>
        </div>

        <div className="w-100 mt-4 container-fluid">
          <DataTable
            columns={AccountListcolumns}
            data={filteredAccountListData}
            customStyles={customStyles}
            pagination
            onRowClicked={handleViewAccountList}
            className="dataTable"
          />
        </div>
      </div>

      <Modal show={showAddAccount} onHide={handleCloseAddAccount} size="xl">
        <Form noValidate onSubmit={handleSubmit(addAccountList)}>
          <Modal.Header closeButton>
            <Modal.Title>ACCOUNT DETAIL</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <Form.Label>Account Type</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="Bank"
                  id="bank"
                  value="Bank"
                  checked={accountType === "Bank"}
                  onChange={handleAccountTypeChange}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="Petty Cash"
                  id="pettyCash"
                  value="Petty Cash"
                  checked={accountType === "Petty Cash"}
                  onChange={handleAccountTypeChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-6">
                <Form.Label>Account Name</Form.Label>
                <Form.Control
                  type="text"
                  className={`p-3 ${errors.accountName ? "is-invalid" : ""}`}
                  placeholder="Account Name"
                  {...register("accountName", {
                    required: "Account name is required",
                  })}
                />
                {errors.accountName && (
                  <div className="invalid-feedback">
                    {errors.accountName.message}
                  </div>
                )}
              </div>
              <div className="col-6">
                <Form.Label>Account Number</Form.Label>
                <Form.Control
                  type="text"
                  className={`p-3 ${errors.accountNumber ? "is-invalid" : ""}`}
                  placeholder="Account Number"
                  {...register("accountNumber", {
                    required: "Account number is required",
                  })}
                />
                {errors.accountNumber && (
                  <div className="invalid-feedback">
                    {errors.accountNumber.message}
                  </div>
                )}
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-6">
                <Form.Label>Bank Name</Form.Label>
                <Form.Control
                  type="text"
                  className={`p-3 ${errors.bankName ? "is-invalid" : ""}`}
                  placeholder="Bank Name"
                  {...register("bankName", {
                    required: "Bank name is required",
                  })}
                />
                {errors.bankName && (
                  <div className="invalid-feedback">
                    {errors.bankName.message}
                  </div>
                )}
              </div>

              <div className="col-6">
                {accountType === "Petty Cash" && (
                  <>
                    <Form.Label>Account Holder</Form.Label>
                    <Form.Select
                      className={`p-3 ${
                        errors.accountHolder ? "is-invalid" : ""
                      }`}
                      {...register("accountHolder", {
                        required: "Account holder is required",
                      })}
                    >
                      <option value="" disabled selected>
                        Select Account Holder
                      </option>
                      {userData.map((user, index) => (
                        <option key={index} value={user.id}>
                          {`${user.fname} ${
                            user.mname ? user.mname + " " : ""
                          }${user.lname}`}
                        </option>
                      ))}
                    </Form.Select>
                    {errors.accountHolder && (
                      <div className="invalid-feedback">
                        {errors.accountHolder.message}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-3">
                <Form.Label>Currency</Form.Label>
                <Form.Select
                  className={`p-3 ${errors.currency ? "is-invalid" : ""}`}
                  {...register("currency", {
                    required: "Currency is required",
                  })}
                >
                  <option value="" disabled selected>
                    Select Currency
                  </option>
                  {currencyData.map((currency, index) => (
                    <option key={index} value={currency.id}>
                      {currency.currency_name}
                    </option>
                  ))}
                </Form.Select>
                {errors.currency && (
                  <div className="invalid-feedback">
                    {errors.currency.message}
                  </div>
                )}
              </div>

              <div className="col-5">
                <Form.Label htmlFor="bankAmount">Capital</Form.Label>
                <div className="input-group">
                  <span className="input-group-text p-3">₱</span>
                  <Form.Control
                    type="number"
                    className={`p-3 ${errors.bankAmount ? "is-invalid" : ""}`}
                    id="bankAmount"
                    {...register("bankAmount", {
                      required: "Amount is required",
                    })}
                  />
                  {errors.bankAmount && (
                    <div className="invalid-feedback">
                      {errors.bankAmount.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-4">
                <Form.Label htmlFor="balanceMaintain">
                  Maintaining Balance
                </Form.Label>
                <div className="input-group">
                  <span className="input-group-text p-3">₱</span>
                  <Form.Control
                    type="number"
                    className={`p-3 ${
                      errors.balanceMaintain ? "is-invalid" : ""
                    }`}
                    id="balanceMaintain"
                    {...register("balanceMaintain", {
                      required: "Maintaining balance is required",
                    })}
                  />
                  {errors.balanceMaintain && (
                    <div className="invalid-feedback">
                      {errors.balanceMaintain.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-12">
                <Form.Label htmlFor="remarks">Remarks</Form.Label>
                <Form.Control
                  id="remarks"
                  as="textarea"
                  rows={3}
                  style={{
                    fontSize: "16px",
                    height: "200px",
                    maxHeight: "200px",
                    resize: "none",
                    overflowY: "auto",
                  }}
                  placeholder="Enter Remarks"
                  {...register("remarks")}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleCloseAddAccount}>
              Close
            </Button>
            <Button type="submit" variant="primary">
              Submit
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default AccountList;
