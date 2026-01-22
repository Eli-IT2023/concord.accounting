import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import BASE_URL from "../../../assets/global/url";
import swal from "sweetalert";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

import useFormattedNumberInput from "../../../hooks/customHook/Number_Formatter"; // Import the custom hook for number formatting
function TaxSettingsAdd() {
  const { id } = useParams(); // Get the ID from the URL parameters
  const navigate = useNavigate(); // Initialize the useNavigate hook
  const [name, setName] = useState("");
  const [applicableRates, handleApplicableRateChange, setApplicableRates] =
    useFormattedNumberInput("", 2);
  const [thresholdAmount, handleThresholdChange, setThresholdAmount] =
    useFormattedNumberInput("", 2);
  const [applicability, setApplicability] = useState("Purchase");
  const [transactionType, setTransactionType] = useState("");
  const [description, setDescription] = useState("");
  const [validated, setValidated] = useState(false);

  const userLoggedID = useDecodeToken();

  const handleFormCreate = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      swal({
        title: "Are you sure?",
        text: "You are about to create a new tax rule.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willCreate) => {
        if (willCreate) {
          axios
            .post(BASE_URL + "/tax_settings/tax_create", {
              name,
              applicableRates: parseFloat(applicableRates.replace(/,/g, "")),
              thresholdAmount: parseFloat(thresholdAmount.replace(/,/g, "")),
              applicability,
              transactionType,
              description,
              userLoggedID,
            })
            .then((response) => {
              if (response.status === 200) {
                swal({
                  title: "Rule Added Successfully!",
                  text: "Parameter has been added successfully.",
                  icon: "success",
                  button: "OK",
                }).then(() => {
                  setValidated(false);
                  navigate("/taxmngnt/tax-settings");
                });
              } else if (response.status === 201) {
                swal({
                  title: "Rule Name Exists",
                  text: "Please input other name.",
                  icon: "error",
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const handleFormUpdate = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      swal({
        title: "Are you sure?",
        text: "You are about to save changes.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willEdit) => {
        if (willEdit) {
          axios
            .post(BASE_URL + "/tax_settings/tax_edit", {
              id,
              name,
              applicableRates: parseFloat(applicableRates.replace(/,/g, "")),
              thresholdAmount: parseFloat(thresholdAmount.replace(/,/g, "")),
              applicability,
              transactionType,
              description,
              userLoggedID,
            })
            .then((response) => {
              if (response.status === 200) {
                swal({
                  title: "Rule Updated Successfully!",
                  text: "Rule has been updated successfully.",
                  icon: "success",
                  button: "OK",
                }).then(() => {
                  setValidated(false);
                  navigate("/taxmngnt/tax-settings");
                });
              } else if (response.status === 201) {
                swal({
                  title: "Tax Name Exists",
                  text: "Please input other name.",
                  icon: "error",
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  useEffect(() => {
    if (id !== "create") {
      axios
        .get(BASE_URL + "/tax_settings/getTaxSettingsById", {
          params: { id },
        })
        .then((response) => {
          const data = response.data;
          setName(data.name);
          setApplicableRates(data.rate);
          setThresholdAmount(data.threshold_amount);
          setApplicability(data.applicability);
          setTransactionType(data.transaction_type);
          setDescription(data.description);
        });
    }
  }, []);

  return (
    <div className="h-100 w-100 bg-white">
      <div className="w-100 d-flex flex-row justify-content-between align-items-center p-3">
        <h4 className="m-0">TAX SETTINGS</h4>
      </div>

      <Form
        noValidate
        validated={validated}
        onSubmit={id === "create" ? handleFormCreate : handleFormUpdate}
      >
        <div className="p-5">
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <label htmlFor="taxName" className="form-label">
                TAX Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control p-2"
                id="taxName"
                placeholder="Withholding Tax on Services"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="col-md-3 mb-3">
              <label htmlFor="applicableRates" className="form-label">
                Applicable Rates (%) <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control p-2"
                id="applicableRates"
                placeholder="e.g., 5, 10, 15"
                value={applicableRates}
                onChange={handleApplicableRateChange}
                required
              />
            </div>
            <div className="col-md-3 mb-3">
              <label htmlFor="thresholdAmount" className="form-label">
                Threshold Amount (Optional)
              </label>
              <input
                type="text"
                className="form-control p-2"
                id="thresholdAmount"
                placeholder="e.g., 5, 10, 15"
                value={thresholdAmount}
                onChange={handleThresholdChange}
              />
            </div>
          </div>

          <div className="row mb-5">
            <div className="col-md-6 mb-3">
              <label htmlFor="applicability" className="form-label">
                Applicability <span className="text-danger">*</span>
              </label>
              <select
                className="form-select p-2"
                id="applicability"
                value={applicability}
                onChange={(e) => setApplicability(e.target.value)}
                required
              >
                <option disabled value="">
                  Select Applicability
                </option>
                <option value="Purchase">Purchase</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="transactionType" className="form-label">
                Transaction Type <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control p-2"
                id="transactionType"
                placeholder="Service"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="border  mb-3"></div>
          <div className="row mb-5">
            <div className="col-12">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                className="form-control p-2"
                id="description"
                rows="5"
                placeholder="Enter Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="row">
            <div className="col-12 d-flex justify-content-end">
              <button
                type="button"
                onClick={() => navigate("/taxmngnt/tax-settings")}
                className="btn btn-light me-2"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}

export default TaxSettingsAdd;
