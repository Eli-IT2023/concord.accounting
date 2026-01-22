import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form } from "react-bootstrap";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import NoAccess from "../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
const InAppNotification = ({ authrztn }) => {
  const [validated, setValidated] = useState(false);
  const [isCheckedAlertDate, setIsCheckedAlertDate] = useState(false);
  const [isCheckedLastTransact, setIsCheckedLastTransact] = useState(false);
  const [dueDateDays, setDueDateDays] = useState("");
  const [lastTransactionDays, setLastTransactionDays] = useState("");
  const [isSaveEnabled, setIsSaveEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelButtonHidden, setIsCancelButtonHidden] = useState(true);

  const userLoggedID = useDecodeToken();

  // due date
  const handleCheckboxAlertDateChange = () => {
    setIsCheckedAlertDate(!isCheckedAlertDate);
    setDueDateDays("");
    setIsSaveEnabled(false);
    setIsCancelButtonHidden(false);
  };

  // last transact
  const handleCheckboxLastTransactChange = () => {
    setIsCheckedLastTransact(!isCheckedLastTransact);
    setLastTransactionDays("");
    setIsSaveEnabled(false);
    setIsCancelButtonHidden(false);
  };

  const handleCancel = () => {
    // setIsCheckedAlertDate(false);
    // setIsCheckedLastTransact(false);
    // setDueDateDays("");
    // setLastTransactionDays("");
    // setIsSaveEnabled(false);
    fetchNotificationData();
    setIsCancelButtonHidden(true);
  };

  const fetchNotificationData = () => {
    axios.get(BASE_URL + "/notification/getNotificationData").then((res) => {
      res.data.forEach((item) => {
        if (item.setting_type === "Due Date Alert") {
          setIsCheckedAlertDate(item.isChecked === true);
          setDueDateDays(item.days || "");
        }
        if (item.setting_type === "Customer Last Transaction") {
          setIsCheckedLastTransact(item.isChecked === true);
          setLastTransactionDays(item.days || "");
        }
        setIsLoading(false);
      });
    });
  };

  const save = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the required fields.",
      });
    } else {
      const data = [];

      if (isCheckedAlertDate) {
        data.push({
          setting_type: "Due Date Alert",
          days: dueDateDays || null,
          isChecked: isCheckedAlertDate ? 1 : 0,
        });
      }

      if (isCheckedLastTransact) {
        data.push({
          setting_type: "Customer Last Transaction",
          days: lastTransactionDays || null,
          isChecked: isCheckedLastTransact ? 1 : 0,
        });
      }

      swal({
        title: "Save these settings?",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (confirmed) => {
        if (confirmed) {
          try {
            const res = await axios.post(`${BASE_URL}/notification/save`, {
              notifications: data,
              userLoggedID,
            });
            if (res.status === 200) {
              swal({
                title: "Success",
                icon: "success",
                timer: 2000,
              }).then(() => {
                setValidated(false);
                fetchNotificationData();
              });
            } else {
              swal({
                title: "Oops!",
                text: "There was an error.",
                icon: "warning",
                timer: 2000,
              });
            }
          } catch (err) {
            swal({
              title: "Error",
              text: "Could not save settings. Please try again later.",
              icon: "error",
            });
          }
        }
      });
    }
    setValidated(true);
  };

  const handleDueDateChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setDueDateDays(value);
    checkSaveEnabled(value, lastTransactionDays);
    setIsCancelButtonHidden(false);
  };

  const handleLastTransactionChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setLastTransactionDays(value);
    checkSaveEnabled(dueDateDays, value);
    setIsCancelButtonHidden(false);
  };

  const checkSaveEnabled = (dueDate, lastTransaction) => {
    setIsSaveEnabled(!!dueDate || !!lastTransaction);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotificationData();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {isLoading ? (
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
              <span className="fs-3 text-uppercase">In-App Notification</span>
            </div>
          </div>
          <Form noValidate validated={validated} onSubmit={save}>
            <div className="container-fluid mt-4 p-3">
              <span className="fw-bold">Transaction</span>
              <div className="w-100 row mt-4">
                <div className="col-sm">
                  <span style={{ fontWeight: 500 }}>
                    Due Date Alert (Days Before)
                  </span>
                  <br />
                  <span
                    className="text-secondary"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Designed to alert the user when an invoice is approaching
                    its due date and has not yet been paid. The alert is
                    triggered when the invoice reaches a certain number of days
                    before its due date
                  </span>
                  <div className="w-100 d-flex flex-row mt-2 align-items-center">
                    <Form.Check
                      type="checkbox"
                      id="dueDate"
                      checked={isCheckedAlertDate}
                      onChange={handleCheckboxAlertDateChange}
                    />
                    <Form.Control
                      type="text"
                      id="dueDateValue"
                      placeholder="0"
                      className="w-25 mx-2"
                      disabled={!isCheckedAlertDate}
                      onInput={handleDueDateChange}
                      value={dueDateDays}
                    />
                  </div>
                </div>
                <div className="col-sm"></div>
              </div>
              <div className="w-100 row mt-5">
                <div className="col-sm">
                  <span style={{ fontWeight: 500 }}>
                    Customer Last Transaction Alert (Days After)
                  </span>
                  <br />
                  <span
                    className="text-secondary"
                    style={{ fontSize: "0.9rem" }}
                  >
                    It is a feature in a system that alerts the user when a
                    certain number of days have passed since the last
                    transaction with a customer.
                  </span>
                  <div className="w-100 d-flex flex-row mt-2 align-items-center">
                    <Form.Check
                      type="checkbox"
                      id="dueDate"
                      checked={isCheckedLastTransact}
                      onChange={handleCheckboxLastTransactChange}
                    />
                    <Form.Control
                      type="text"
                      id="dueDateValue"
                      placeholder="0"
                      className="w-25 mx-2"
                      disabled={!isCheckedLastTransact}
                      onInput={handleLastTransactionChange}
                      value={lastTransactionDays}
                    />
                  </div>
                </div>
                <div className="col-sm"></div>
              </div>

              <div className="w-100 row mt-5">
                <div className="col-sm">
                  <button
                    className={`btn btn-secondary ${
                      isCancelButtonHidden && "d-none"
                    }`}
                    type="button"
                    onClick={handleCancel}
                    style={{ marginRight: "10px" }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={!isSaveEnabled}
                  >
                    Save
                  </button>
                </div>
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

export default InAppNotification;
