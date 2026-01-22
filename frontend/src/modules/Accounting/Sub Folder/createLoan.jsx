import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
// import Select from "react-select";
// import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

const CreateLoan = () => {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [userMasterList, setUserMasterList] = useState([]);
  const [accountList, setAccountList] = useState([]);
  const [labelData, setLabelData] = useState([]);
  // const [paymentForecast, setPaymentForecast] = useState([]);
  const [bankAmount, setBankAmount] = useState("");
  // const [modalPaymentForecast, setModalPaymentForecast] = useState(false);

  // const handleCloseModalPayment = () => {
  //   setModalPaymentForecast(false);
  // };

  const handleCancelLoan = () => {
    navigate("/accounting/loan");
  };

  const { register, setValue, getValues, watch } = useForm({
    defaultValues: {
      loanReference: "",
      loanType: "",
      loanUser: "",
      accountID: "",
      label_id: "",
      paymentOptions: "",
      loanAmount: "",
      interestPercent: "",
      interestAmount: "",
      loanTerms: "",
      remarks: "",
    },
  });

  const fetchLastCode = () => {
    axios
      .get(BASE_URL + "/loan/loanRefCode")
      .then((res) => {
        setValue("loanReference", res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchUserList = () => {
    axios
      .get(BASE_URL + "/loan/fetchUserList")
      .then((res) => {
        setUserMasterList(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchAccountList = () => {
    axios
      .get(BASE_URL + "/loan/getAccountListData")
      .then((res) => {
        setAccountList(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchLabelData = () => {
    axios
      .get(BASE_URL + "/label/fetchTable")
      .then((res) => {
        setLabelData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const addLoan = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      const formData = getValues();

      // formData.paymentForecast = paymentForecast;

      axios
        .post(`${BASE_URL}/loan/createLoan`, formData)
        .then((res) => {
          if (res.status === 200) {
            swal({
              title: "Success",
              text: "Loan created successfully",
              icon: "success",
              buttons: false,
              timer: 2000,
              dangerMode: true,
            }).then(() => {
              setValidated(false);
              navigate("/accounting/loan");
              fetchLastCode();
            });
          } else if (res.status === 201) {
            swal({
              title: "Something Went Wrong",
              text: "Loan process failed",
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
            });
          }
        })
        .catch((error) => {
          swal({
            title: "Error",
            text: "An error occurred during the loan creation process.",
            icon: "error",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          });
          console.error("There was an error creating the loan:", error);
        });
    }
    setValidated(true);
  };

  const loanAmount = watch("loanAmount");
  const interestPercent = watch("interestPercent");
  const loanTerms = watch("loanTerms");
  const interestAmount = watch("interestAmount");

  useEffect(() => {
    const calculatedInterestAmount =
      (parseFloat(loanAmount) * parseFloat(interestPercent)) / 100 || 0;
    setValue("interestAmount", calculatedInterestAmount);
  }, [loanAmount, interestPercent, setValue]);

  // const handleForecastClick = () => {
  //   setModalPaymentForecast(true);
  // };

  // useEffect(() => {
  //   const loanAmount = parseFloat(getValues("loanAmount")) || 0;
  //   const interestPercent = parseFloat(getValues("interestPercent")) || 0;
  //   const loanTerms = parseInt(getValues("loanTerms")) || 0;

  //   if (loanAmount && loanTerms) {
  //     const principal = loanAmount / loanTerms;
  //     const interest = (loanAmount * interestPercent) / 100 / loanTerms;

  //     const forecastData = Array.from({ length: loanTerms }, (_, i) => {
  //       const currentDate = new Date();
  //       const installmentDate = new Date(currentDate);
  //       installmentDate.setMonth(currentDate.getMonth() + i + 1);

  //       const dueDate = new Date(installmentDate);
  //       dueDate.setMonth(installmentDate.getMonth() + 1);

  //       return {
  //         installmentNumber: i + 1,
  //         month: installmentDate.toISOString().split("T")[0],
  //         dueDate: dueDate.toISOString().split("T")[0],
  //         principal: principal.toFixed(2),
  //         interest: interest.toFixed(2),
  //         total: principal + interest,
  //       };
  //     });

  //     setPaymentForecast(forecastData);
  //   }
  // }, [
  //   getValues("loanAmount"),
  //   getValues("interestPercent"),
  //   getValues("loanTerms"),
  // ]);

  // const totalAmortization = paymentForecast.reduce(
  //   (sum, payment) => sum + payment.total,
  //   0
  // );

  const handleAccountChange = (e) => {
    const selectedAccountId = e.target.value;
    const selectedAccount = accountList.find(
      (account) =>
        String(account.account_list_id) === String(selectedAccountId, 10)
    );

    if (selectedAccount) {
      setBankAmount(selectedAccount.bank_amount);
    } else {
      setBankAmount("0");
    }
  };

  useEffect(() => {
    if (loanAmount && parseFloat(loanAmount) > parseFloat(bankAmount)) {
      swal({
        icon: "warning",
        title: "Invalid Loan Amount",
        text: "The loan amount cannot exceed the bank amount.",
        confirmButtonText: "OK",
      });
      setValue("loanAmount", "0");
    }
  }, [loanAmount, bankAmount, setValue]);

  // const modalColumns = [
  //   {
  //     name: "Month",
  //     selector: (row) => row.month,
  //   },
  //   {
  //     name: "Due Date",
  //     selector: (row) => row.dueDate,
  //   },
  //   {
  //     name: "Principal",
  //     selector: (row) =>
  //       row.principal.toLocaleString("en-US", {
  //         minimumFractionDigits: 2,
  //         maximumFractionDigits: 2,
  //       }),
  //   },
  //   {
  //     name: "Interest",
  //     selector: (row) =>
  //       row.interest.toLocaleString("en-US", {
  //         minimumFractionDigits: 2,
  //         maximumFractionDigits: 2,
  //       }),
  //   },
  //   {
  //     name: "Total Amortization",
  //     selector: (row) =>
  //       row.total.toLocaleString("en-US", {
  //         minimumFractionDigits: 2,
  //         maximumFractionDigits: 2,
  //       }),
  //   },
  // ];

  useEffect(() => {
    fetchLastCode();
    fetchUserList();
    fetchAccountList();
    fetchLabelData();
  }, []);
  return (
    <>
      <div className="h-100 w-100 border bg-white custom-container">
        <div className="w-100 p-2 d-flex flex-row justify-content-between">
          <div className="d-flex flex-column title-custom">
            <span className="fs-3">LOAN FORM</span>
          </div>
          <div></div>
        </div>
        <Form noValidate validated={validated} onSubmit={addLoan}>
          <div className="container">
            <div className="row mt-3 mb-2">
              <div className="col-sm mb-2">
                <span>Loan Number</span>
                <input
                  type="text"
                  name=""
                  id=""
                  className="form-control p-3"
                  readOnly
                  {...register("loanReference")}
                />
              </div>
              <div className="col-sm mb-2">
                <span>
                  Loan Type <span className="text-danger">*</span>
                </span>
                <select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("loanType")}
                  required
                >
                  <option value="" selected disabled>
                    Select Loan Type
                  </option>
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Employee Loan">Employee Loan</option>
                  <option value="Vendor Loan">Vendor Loan</option>
                </select>
              </div>
              <div className="col-sm mb-2">
                <span>
                  Name <span className="text-danger">*</span>
                </span>
                <select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("loanUser")}
                  required
                >
                  <option value="" selected disabled>
                    Select Name
                  </option>
                  {userMasterList.map((data, i) => (
                    <option key={data.id} value={data.id}>
                      {`${data.fname} ${data.mname} ${data.lname}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <span>
                  Account <span className="text-danger">*</span>
                </span>
                <select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("accountID")}
                  required
                  onChange={handleAccountChange}
                >
                  <option value="" selected disabled>
                    Select Account
                  </option>
                  {accountList.map((data, i) => (
                    <option
                      key={data.account_list_id}
                      value={data.account_list_id}
                    >
                      {`${data.bank_name} - ${data.account_name}`}
                    </option>
                  ))}
                </select>
                {bankAmount && (
                  <span style={{ color: "red" }}>
                    Bank Amount:{" "}
                    {bankAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                )}
              </div>
              <div className="col-12 col-md-4 mb-2">
                <span>
                  Payment Options <span className="text-danger">*</span>
                </span>
                <select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("paymentOptions")}
                  required
                >
                  <option value="" selected disabled>
                    Select Payment
                  </option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Check">Check</option>
                </select>
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <div className="row">
                  <div className="col-sm mb-2">
                    <span>
                      Loan Amount <span className="text-danger">*</span>
                    </span>
                    <div className="input-group mb-2">
                      <div className="input-group-prepend">
                        <div className="input-group-text h-100">₱</div>
                      </div>
                      <input
                        type="text"
                        className="form-control p-3"
                        id="inlineFormInputGroup"
                        placeholder="0.00"
                        {...register("loanAmount")}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-sm mb-2">
                    <span>
                      Int Per (%)
                      {/* <span className="text-danger">*</span> */}
                    </span>
                    <div className="input-group mb-2">
                      <div className="input-group-prepend">
                        <div className="input-group-text h-100">%</div>
                      </div>
                      <input
                        type="text"
                        className="form-control p-3"
                        id="inlineFormInputGroup"
                        placeholder="0"
                        {...register("interestPercent")}
                      />
                    </div>
                  </div>
                  <div className="col-sm mb-2">
                    <span>
                      Int Amount <span className="text-danger">*</span>
                    </span>
                    <div className="input-group mb-2">
                      <div className="input-group-prepend">
                        <div className="input-group-text h-100">₱</div>
                      </div>
                      <input
                        type="text"
                        className="form-control p-3"
                        id="inlineFormInputGroup"
                        placeholder="0.00"
                        {...register("interestAmount")}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4 mb-2"></div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <div className="row">
                  <div className="col-sm mb-2">
                    <span>
                      Term | Cutoff <span className="text-danger">*</span>
                    </span>
                    <input
                      type="text"
                      className="form-control p-3"
                      id="inlineFormInputGroup"
                      {...register("loanTerms")}
                    />
                  </div>
                  <div className="col-sm mb-2">
                    <span>
                      Subject <span className="text-danger">*</span>
                    </span>
                    <Form.Select
                      name=""
                      id=""
                      className="form-select p-3"
                      {...register("label_id")}
                      required
                    >
                      <option value="" selected disabled>
                        Select Subject
                      </option>
                      {labelData.map((data, i) => (
                        <option key={data.id} value={data.id}>
                          {`${data.label_name} - ${data.sub_label_name}`}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  {/* <div className="col-12 col-md-4 mb-3 d-flex align-items-end">
                    <button
                      className="btn btn-outline-primary w-100 p-3 forecast-btn"
                      type="button"
                      onClick={handleForecastClick}
                    >
                      Forecast Payment
                    </button>
                  </div> */}
                </div>
              </div>
              <div className="col-12 col-md-4 mb-2"></div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <span>Remarks</span>
                <textarea
                  name=""
                  id=""
                  cols="5"
                  rows="5"
                  className="form-control"
                  {...register("remarks")}
                ></textarea>
              </div>
              <div className="col-12 col-md-4 mb-2"></div>
            </div>
            <div className="row mt-4">
              <div className="col-sm"></div>
              <div className="col-sm"></div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                <button
                  className="btn btn-outline-secondary w-100 me-3 p-2"
                  type="button"
                  onClick={handleCancelLoan}
                >
                  Cancel
                </button>
                <button className="btn btn-primary w-100 p-2" type="submit">
                  Save
                </button>
              </div>
            </div>
          </div>
        </Form>
      </div>

      {/* <Modal
        show={modalPaymentForecast}
        onHide={handleCloseModalPayment}
        size="xl"
      >
        <Modal.Header className="border-0">
          <Modal.Title>
            FORECAST PAYMENT: <strong>{loanTerms} Months</strong>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={modalColumns}
              data={paymentForecast}
              customStyles={customStyles}
              pagination
              className="dataTable"
            />
          </div>
          <div className="d-flex w-100 float-right border p-2 fs-4">
            <strong>
              Total:{" "}
              {totalAmortization.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
        </Modal.Body>
      </Modal> */}
    </>
  );
};

export default CreateLoan;
