import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import { MultiSelect } from "react-multi-select-component";
import BASE_URL from "../../assets/global/url";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { format } from "date-fns";
import CustomDatePicker from "../../components/CustomDatePicker";

const ActivityLog = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const [isLoading, setIsLoading] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState([]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [dateFrom, setDateFrom] = useState(
    new Date().toISOString().split("T")[0]
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
          {...(row.action_taken.length > 128
            ? { title: row.action_taken }
            : {})}
          className="text-center"
        >
          {truncateText(row.action_taken, 128)}
        </div>
      ),
    },
    {
      name: "Date",
      selector: (row) => format(row.createdAt, "MMM/dd/yyyy, hh:mm a"),
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

  const pagination = useServerPagination(
    `${BASE_URL}/activity_log/getUserActivityLog`,
    10
  );

  const handleFetchActivityLog = async () => {
    pagination.updateParams({
      userLoggedID,
      selectedAccount,
      dateFrom,
      dateTo,
    });
    setIsLoading(false);
    // try {
    //   setIsLoading(false);
    //   const res = await axios.get(
    //     `${BASE_URL}/activity_log/getUserActivityLog`,
    //     {
    //       params: {
    //         userLoggedID,
    //         selectedAccount,
    //         dateFrom,
    //         dateTo,
    //       },
    //     }
    //   );
    //   setActivityLogData(res.data);
    // } catch (error) {
    //   console.error(error);
    // }
  };

  useEffect(() => {
    setActivityLogData(pagination.data);
  }, [pagination.data]);

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
  const CustomInput = React.forwardRef(
    ({ value, onClick, generateYears }, ref) => (
      <input
        type="text"
        className="form-control p-2 w-100"
        style={{
          cursor: "pointer",
          caretColor: "transparent",
        }}
        onClick={() => {
          onClick();

          const date = new Date(value).getFullYear();

          generateYears(date); // Reset/Initialize Year List based on selected date of birth
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
      />
    )
  );

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
      ) : authrztn.includes("Currency-View") ? (
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
                <div className="flex-grow-1 me-2">
                  <label>From</label>
                  {/* <div className="position-relative">
                    <DatePicker
                      selected={dateFrom}
                      onChange={(date) => {
                        setDateFrom(date);
                      }}
                      dateFormat="MMM/dd/yyyy"
                      className="form-control p-2"
                      customInput={<CustomInput />}
                    />
                    <i
                      class="fa-solid fa-calendar-week calendar-position"
                      style={{
                        right: "1rem",
                        top: "0.8rem",
                      }}
                    ></i>
                  </div> */}
                  <CustomDatePicker
                    selected={dateFrom ? new Date(dateFrom) : ""}
                    handleDateChange={(date) => {
                      setDateFrom(date);
                    }}
                    setter={setDateFrom}
                    CustomInput={CustomInput}
                  />
                </div>
                <div className="flex-grow-1">
                  <label>To</label>
                  {/* <div className="flex-grow-1 position-relative">
                    <DatePicker
                      selected={dateTo}
                      onChange={(date) => {
                        setDateTo(date);
                      }}
                      dateFormat="MMM/dd/yyyy"
                      className="form-control p-2"
                      customInput={<CustomInput />}
                    />
                    <i
                      class="fa-solid fa-calendar-week calendar-position"
                      style={{
                        right: "1rem",
                        top: "0.8rem",
                      }}
                    ></i>
                  </div> */}
                  <CustomDatePicker
                    selected={dateTo ? new Date(dateTo) : ""}
                    handleDateChange={(date) => {
                      setDateTo(date);
                    }}
                    setter={setDateTo}
                    CustomInput={CustomInput}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              customStyles={customStyles}
              className="dataTable"
              data={activityLogData}
            />
            <PaginationControls {...pagination} />
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
