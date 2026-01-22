import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Badge } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

const GeneralSettings = ({ authrztn }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [checkboxState, setCheckboxState] = useState({
    "SI-CB": false,
    "DC-CB": false,
    "DR-CB": false,
  });

  const [formValues, setFormValues] = useState({
    SI: "",
    DC: "",
    DR: "",
  });

  // NEW: State for alphabetical fields
  const [alphabeticalValues, setAlphabeticalValues] = useState({
    SI_ALPHA: "",
    DC_ALPHA: "",
    DR_ALPHA: "",
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchSeriesNumbers();
  }, []);

  const fetchSeriesNumbers = async () => {
    try {
      setIsDataLoading(true);
      const response = await axios.get(
        BASE_URL + "/general-settings/get-series-numbers"
      );

      if (response.status === 200) {
        const data = response.data;

        setFormValues({
          SI: data.salesInvoice.value,
          DC: data.deliveryConfirmation.value,
          DR: data.deliveryReceipt.value,
        });

        // NEW: Set alphabetical values if they exist in the response
        setAlphabeticalValues({
          SI_ALPHA: data.salesInvoice.alphabeticalValue || "",
          DC_ALPHA: data.deliveryConfirmation.alphabeticalValue || "",
          DR_ALPHA: data.deliveryReceipt.alphabeticalValue || "",
        });

        setCheckboxState({
          "SI-CB": data.salesInvoice.isActive,
          "DC-CB": data.deliveryConfirmation.isActive,
          "DR-CB": data.deliveryReceipt.isActive,
        });
      }
    } catch (error) {
      console.error("Error fetching series numbers:", error);
      await swal({
        title: "Error!",
        text: "Failed to load series numbers. Please try again.",
        icon: "error",
        button: "OK",
      });
    } finally {
      setIsDataLoading(false);
    }
  };

  const userLoggedID = useDecodeToken();

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setCheckboxState((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  const handleFormValueChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // NEW: Handle alphabetical field change
  const handleAlphabeticalChange = (e) => {
    const { name, value } = e.target;
    // Convert to uppercase and limit to 10 characters
    const uppercaseValue = value.toUpperCase().slice(0, 10);
    setAlphabeticalValues((prevState) => ({
      ...prevState,
      [name]: uppercaseValue,
    }));
  };

  const handleKeyPress = (e) => {
    // Only allow numbers (0-9)
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  // NEW: Handle alphabetical field key press (allow letters only)
  const handleAlphabeticalKeyPress = (e) => {
    // Only allow letters (A-Z, a-z)
    if (
      !/[a-zA-Z]/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "Tab"
    ) {
      e.preventDefault();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate that all active inputs have values
      const validationErrors = [];

      if (checkboxState["SI-CB"]) {
        if (!formValues.SI.trim()) {
          validationErrors.push(
            "Sales Invoice series number is required when active"
          );
        }
        // NEW: Validate alphabetical field length if provided
        if (
          alphabeticalValues.SI_ALPHA &&
          alphabeticalValues.SI_ALPHA.length > 10
        ) {
          validationErrors.push(
            "Sales Invoice alphabetical prefix cannot exceed 10 characters"
          );
        }
      }

      if (checkboxState["DC-CB"]) {
        if (!formValues.DC.trim()) {
          validationErrors.push(
            "Delivery Confirmation series number is required when active"
          );
        }
        if (
          alphabeticalValues.DC_ALPHA &&
          alphabeticalValues.DC_ALPHA.length > 10
        ) {
          validationErrors.push(
            "Delivery Confirmation alphabetical prefix cannot exceed 10 characters"
          );
        }
      }

      if (checkboxState["DR-CB"]) {
        if (!formValues.DR.trim()) {
          validationErrors.push(
            "Delivery Receipt series number is required when active"
          );
        }
        if (
          alphabeticalValues.DR_ALPHA &&
          alphabeticalValues.DR_ALPHA.length > 10
        ) {
          validationErrors.push(
            "Delivery Receipt alphabetical prefix cannot exceed 10 characters"
          );
        }
      }

      if (validationErrors.length > 0) {
        await swal({
          title: "Validation Error",
          text: validationErrors.join("\n"),
          icon: "error",
          button: "OK",
        });
        setIsLoading(false);
        return;
      }

      const payload = {
        salesInvoice: {
          value: formValues.SI,
          alphabeticalValue: alphabeticalValues.SI_ALPHA, // NEW
          isActive: checkboxState["SI-CB"],
        },
        deliveryConfirmation: {
          value: formValues.DC,
          alphabeticalValue: alphabeticalValues.DC_ALPHA, // NEW
          isActive: checkboxState["DC-CB"],
        },
        deliveryReceipt: {
          value: formValues.DR,
          alphabeticalValue: alphabeticalValues.DR_ALPHA, // NEW
          isActive: checkboxState["DR-CB"],
        },
        updatedBy: userLoggedID,
      };

      console.log(payload, `this is payload`);

      const response = await axios.put(
        BASE_URL + "/general-settings/update-series-numbers",
        payload
      );

      if (response.status === 200) {
        await swal({
          title: "Success!",
          text: "Series numbers updated successfully!",
          icon: "success",
          button: "OK",
        });
      }
    } catch (error) {
      console.error("Error updating series numbers:", error);
      await swal({
        title: "Error!",
        text: "Failed to update series numbers. Please try again.",
        icon: "error",
        button: "OK",
      });
    } finally {
      setIsLoading(false);
      fetchSeriesNumbers();
    }
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {isDataLoading ? (
        <div className="loading-container">
          <ThreeDot
            variant="brick-stack"
            color="#6290FE"
            size="large"
            text="Loading Data..."
            textColor=""
          />
        </div>
      ) : authrztn.includes("Notifications-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">General Settings</span>
            </div>
            <button
              className="btn btn-primary"
              disabled={isLoading}
              onClick={submit}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
          <Form
            noValidate
            // validated={validated}
          >
            <div className="container-fluid mt-4 px-5">
              <span className="fw-bold">Series No. for Creating Invoices</span>
              <div className="w-100 row mt-4">
                <div className="col-sm">
                  <span style={{ fontWeight: 500 }}>Sales Invoice</span>
                  <br />
                  <span
                    className="text-secondary"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Trailing Series Number upon creating Sales Invoice
                  </span>
                  <div className="w-100 d-flex flex-row mt-2 align-items-center">
                    <Form.Check
                      type="checkbox"
                      id="SI-CB"
                      name="SI-CB"
                      checked={checkboxState["SI-CB"]}
                      onChange={(e) => handleCheckboxChange(e)}
                    />
                    {/* NEW: Alphabetical field */}
                    <Form.Control
                      type="text"
                      id="SI_ALPHA"
                      name="SI_ALPHA"
                      placeholder="AAA"
                      className="w-25 mx-2"
                      maxLength={10}
                      disabled={!checkboxState["SI-CB"]}
                      onChange={handleAlphabeticalChange}
                      onKeyPress={handleAlphabeticalKeyPress}
                      value={alphabeticalValues.SI_ALPHA}
                      style={{ textTransform: "uppercase" }}
                    />
                    <Form.Control
                      type="text"
                      id="SI"
                      name="SI"
                      placeholder="00001"
                      className="w-25 mx-2"
                      maxLength={10}
                      disabled={!checkboxState["SI-CB"]}
                      onInput={(e) => handleFormValueChange(e)}
                      onKeyPress={handleKeyPress}
                      value={formValues.SI}
                    />
                    {checkboxState["SI-CB"] ? (
                      <Badge bg="success" style={{ minWidth: "4.5rem" }}>
                        Active
                      </Badge>
                    ) : (
                      <Badge bg="danger" style={{ minWidth: "4.5rem" }}>
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <small className="text-muted ms-5">
                    Alphabetical prefix (max 10 chars, letters only)
                  </small>
                </div>
                <div className="col-sm"></div>
              </div>
              <div className="w-100 row mt-4">
                <div className="col-sm">
                  <span style={{ fontWeight: 500 }}>Delivery Receipt</span>
                  <br />
                  <span
                    className="text-secondary"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Trailing Series Number upon creating Delivery Receipt
                  </span>
                  <div className="w-100 d-flex flex-row mt-2 align-items-center">
                    <Form.Check
                      type="checkbox"
                      id="DR-CB"
                      name="DR-CB"
                      checked={checkboxState["DR-CB"]}
                      onChange={(e) => handleCheckboxChange(e)}
                    />
                    {/* NEW: Alphabetical field */}
                    <Form.Control
                      type="text"
                      id="DR_ALPHA"
                      name="DR_ALPHA"
                      placeholder="AAA"
                      className="w-25 mx-2"
                      maxLength={10}
                      disabled={!checkboxState["DR-CB"]}
                      onChange={handleAlphabeticalChange}
                      onKeyPress={handleAlphabeticalKeyPress}
                      value={alphabeticalValues.DR_ALPHA}
                      style={{ textTransform: "uppercase" }}
                    />
                    <Form.Control
                      type="text"
                      id="DR"
                      name="DR"
                      placeholder="00001"
                      className="w-25 mx-2"
                      maxLength={10}
                      disabled={!checkboxState["DR-CB"]}
                      onInput={(e) => handleFormValueChange(e)}
                      onKeyPress={handleKeyPress}
                      value={formValues.DR}
                    />
                    {checkboxState["DR-CB"] ? (
                      <Badge bg="success" style={{ minWidth: "4.5rem" }}>
                        Active
                      </Badge>
                    ) : (
                      <Badge bg="danger" style={{ minWidth: "4.5rem" }}>
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <small className="text-muted ms-5">
                    Alphabetical prefix (max 10 chars, letters only)
                  </small>
                </div>
                <div className="col-sm"></div>
              </div>
              <div className="w-100 row mt-4">
                <div className="col-sm">
                  <span style={{ fontWeight: 500 }}>Delivery Confirmation</span>
                  <br />
                  <span
                    className="text-secondary"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Trailing Series Number upon creating Delivery Confirmation
                  </span>
                  <div className="w-100 d-flex flex-row mt-2 align-items-center">
                    <Form.Check
                      type="checkbox"
                      id="DC-CB"
                      name="DC-CB"
                      checked={checkboxState["DC-CB"]}
                      onChange={(e) => handleCheckboxChange(e)}
                    />
                    {/* NEW: Alphabetical field */}
                    <Form.Control
                      type="text"
                      id="DC_ALPHA"
                      name="DC_ALPHA"
                      placeholder="AAA"
                      className="w-25 mx-2"
                      maxLength={10}
                      disabled={!checkboxState["DC-CB"]}
                      onChange={handleAlphabeticalChange}
                      onKeyPress={handleAlphabeticalKeyPress}
                      value={alphabeticalValues.DC_ALPHA}
                      style={{ textTransform: "uppercase" }}
                    />
                    <Form.Control
                      type="text"
                      id="DC"
                      name="DC"
                      placeholder="00001"
                      className="w-25 mx-2"
                      maxLength={10}
                      disabled={!checkboxState["DC-CB"]}
                      onInput={(e) => handleFormValueChange(e)}
                      onKeyPress={handleKeyPress}
                      value={formValues.DC}
                    />
                    {checkboxState["DC-CB"] ? (
                      <Badge bg="success" style={{ minWidth: "4.5rem" }}>
                        Active
                      </Badge>
                    ) : (
                      <Badge bg="danger" style={{ minWidth: "4.5rem" }}>
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <small className="text-muted ms-5">
                    Alphabetical prefix (max 10 chars, letters only)
                  </small>
                </div>

                <div className="col-sm"></div>
              </div>

              <div className="w-100 row mt-4">
                <div className="col-sm"></div>
              </div>
            </div>
          </Form>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
};

export default GeneralSettings;
