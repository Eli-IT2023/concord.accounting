import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

const CreateAssetAccount = () => {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [userMasterList, setUserMasterList] = useState([]);
  const [accountList, setAccountList] = useState([]);
  const [assetLabel, setAssetLabel] = useState([])
  const handleCancel = () => {
    navigate("/accounting/assetaccount");
  };

  const { register, setValue, getValues, watch } = useForm({
    defaultValues: {
      loanReference: "",
      loanUser: "",
      accountName: "",
      assetLabel: "",
      paymentOptions: "",
      releaseDate: "",
      loanAmount: "",
      interestPercent: "",
      interestAmount: "",
      loanTerms: "",
      remarks: "",
    },
  });

  const fetchLastCode = () => {
    axios
      .get(BASE_URL + "/assetAccount/assetRefCode")
      .then((res) => {
        setValue("loanReference", res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchUserList = () => {
    axios
      .get(BASE_URL + "/assetAccount/fetchUserList")
      .then((res) => {
        setUserMasterList(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchAccountList = () => {
    axios
      .get(BASE_URL + "/assetAccount/getAccountListData")
      .then((res) => {
        setAccountList(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchAssetLabel = () => {
    axios
      .get(BASE_URL + "/assetAccount/getAssetLabel")
      .then((res) => {
        setAssetLabel(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const addAssetAccount = async (e) => {
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
        .post(`${BASE_URL}/assetAccount/createAssetAccount`, formData)
        .then((res) => {
          if (res.status === 200) {
            swal({
              title: "Success",
              text: "Asset account created successfully",
              icon: "success",
              buttons: false,
              timer: 2000,
              dangerMode: true,
            }).then(() => {
              setValidated(false);
              navigate("/accounting/assetaccount");
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
            text: "An error occurred during the asset account creation process.",
            icon: "error",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          });
          console.error("There was an error creating the asset account:", error);
        });
    }
    setValidated(true);
  };

  const loanAmount = watch("loanAmount");
  const interestPercent = watch("interestPercent");
  const loanTerms = watch("loanTerms");

  useEffect(() => {
    const calculatedInterestAmount =
      (parseFloat(loanAmount) * parseFloat(interestPercent)) / 100 || 0;
    setValue("interestAmount", calculatedInterestAmount);
  }, [loanAmount, interestPercent, setValue]);


  useEffect(() => {
    fetchLastCode();
    fetchUserList();
    fetchAccountList();
    fetchAssetLabel()
  }, []);
  return (
    <>
      <div className="h-100 w-100 border bg-white custom-container">
        <div className="w-100 p-2 d-flex flex-row justify-content-between">
          <div className="d-flex flex-column title-custom">
            <span className="fs-3">ASSET ACCOUNT FORM</span>
          </div>
          <div>
          </div>
        </div>
        <Form noValidate validated={validated} onSubmit={addAssetAccount}>
          <div className="container">
            <div className="row mt-3 mb-2">
              <div className="col-sm mb-2">
                <span>Asset Account ID</span>
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
                  Name <span className="text-danger">*</span>
                </span>
                <Form.Select
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
                </Form.Select>
              </div>
              <div className="col-sm mb-2">
                <span>
                  Account <span className="text-danger">*</span>
                </span>
                <Form.Select
                  name=""
                  id=""
                  className="form-select p-3"
                  {...register("accountName")}
                  required
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
                </Form.Select>
              </div>
            </div>
            <div className="row mb-2">
              <div className="col-12 col-md-8 mb-2">
                <div className="row">
                  <div className="col-sm mb-2">
                    <span>
                      Payment Options <span className="text-danger">*</span>
                    </span>
                    <Form.Select
                      name=""
                      id=""
                      className="form-select p-3"
                      {...register("paymentOptions")}
                      required
                    >
                      <option value="" selected disabled>
                        Select Option
                      </option>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Check">Check</option>
                    </Form.Select>
                  </div>
                  <div className="col-sm mb-2">
                    <span>
                      Release Date <span className="text-danger">*</span>
                    </span>
                    <Form.Control
                      type="date"
                      name=""
                      id=""
                      className="form-control p-3"
                      {...register("releaseDate")}
                      required
                    />
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
                      Amount <span className="text-danger">*</span>
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
                      Interest (%)
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
                    <span>Total Interest Amount</span>
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
                    {...register("assetLabel")}
                    required
                    >
                    <option value="" selected disabled>
                        Select Label
                    </option>
                    {assetLabel.map((data, i) => (
                        <option
                        key={data.id}
                        value={data.id}
                        >
                        {`${data.label_name} - ${data.sub_label_name}`}
                        </option>
                    ))}
                    </Form.Select>
                  </div>
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
                  onClick={handleCancel}
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
    </>
  );
};

export default CreateAssetAccount;
