import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { MultiSelect } from "react-multi-select-component";
import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";

// for rbac
import NoAccess from "../../assets/img/NoAccess.png";
import { ThreeDot } from "react-loading-indicators";

const ActivityLog = ({ authrztn, roleType, rbacUserRole }) => {
  const userLoggedID = useDecodeToken();
  const [isLoading, setIsLoading] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState([]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [dateFrom, setDateFrom] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [activityLogData, setActivityLogData] = useState([]);

  function formatDate(datetime) {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(datetime).toLocaleString("en-US", options);
  }

  // Put ellipsis to long text
  const truncateText = (str, limit) => {
    return str?.length > limit ? `${str.substring(0, limit) + "..."}` : str;
  };

  const columns = [
    {
      name: "Activity Log",
      selector: (row) => row.action_taken,
      cell: (row) => (
        <div
          // Conditionally add title attribute to div
          {...(row.action_taken.length > 152
            ? { title: row.action_taken }
            : {})}
        >
          {truncateText(row.action_taken, 152)}
        </div>
      ),
    },
    {
      name: "Date",
      selector: (row) => formatDate(row.createdAt),
    },
  ];

  if (userLoggedID === "11111111-1111-1111-1111-111111111111") {
    columns.unshift({
      name: "Name",
      selector: (row) => row.masterlist.uname,
    });
  }

  const handleChange = (selected) => {
    setSelectedAccount(selected);
  };

  const handleFetchAccount = async () => {
    try {
      setIsLoading(false);
      const res = await axios.get(`${BASE_URL}/activity_log/getUserAccounts`);
      setAccountData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFetchActivityLog = async () => {
    try {
      setIsLoading(false);
      const res = await axios.get(
        `${BASE_URL}/activity_log/getUserActivityLog`,
        {
          params: {
            userLoggedID,
            selectedAccount,
            dateFrom,
            dateTo,
          },
        },
      );
      setActivityLogData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (userLoggedID && dateFrom && dateTo) {
      handleFetchAccount();
      handleFetchActivityLog();
    }
  }, [userLoggedID, dateFrom, dateTo, selectedAccount]);

  const accountOptions = accountData.map((option) => ({
    value: option.id,
    label: option.uname,
  }));

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <div className="position-relative">
      <input
        type="text"
        className="form-control w-100" // Added left padding
        style={{
          cursor: "pointer",
          caretColor: "transparent",
        }}
        onClick={onClick}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required
      />
      <span
        onClick={onClick}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
        }}
      >
        <i className="fa-regular fa-calendar"></i>
      </span>
    </div>
  ));

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
      ) : authrztn.includes("ActivityLogs-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">ACTIVITY LOG</span>
            </div>
          </div>

          <div className="w-100 row">
            <div className="col-sm mb-2 ms-2">
              {userLoggedID == 1 ? (
                <>
                  <label htmlFor="subject1">Account</label>

                  <MultiSelect
                    options={accountOptions}
                    value={selectedAccount}
                    onChange={handleChange}
                    labelledBy="Select"
                    className="w-100" // Full-width select component
                    style={{
                      maxWidth: "1000px !important",
                    }} // Apply max-width styling
                  />
                </>
              ) : null}
            </div>

            <div className="col-sm mb-2 pt-4 justify-content-end align-items-end">
              <div className="mb-3 input-group">
                {/* <Form.Control
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                /> */}
                {/* <Form.Control
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                /> */}
                <div className="flex-grow-1">
                  <label>From</label>
                  <div>
                    <DatePicker
                      selected={dateFrom}
                      onChange={(date) => {
                        setDateFrom(date);
                      }}
                      dateFormat="MMM dd, yyyy"
                      className="form-control p-2"
                      customInput={<CustomInput />}
                    />
                  </div>
                </div>
                <div className="flex-grow-1">
                  <label>To</label>
                  <div className="flex-grow-1">
                    <DatePicker
                      selected={dateTo}
                      onChange={(date) => {
                        setDateTo(date);
                      }}
                      dateFormat="MMM dd, yyyy"
                      className="form-control p-2"
                      customInput={<CustomInput />}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              customStyles={customStyles}
              pagination
              className="dataTable"
              data={activityLogData}
            />
          </div>
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

export default ActivityLog;
