import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DateRangePicker from "../../components/DateRangePicker";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { Link, useSearchParams } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import CurrencySelector from "../../components/CurrencySelector";
import PendingStatusTab from "./components/expenses_components/pending_tab";
import { Tabs, Tab, Button, Modal } from "react-bootstrap";
import ExpensesCsv from "./components/expenses_components/expensesCsv";
import ExpensesPdf from "./components/expenses_components/expensesPdf";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { getMonthBoundaries, initializeCutoff } from "../../utils/newdate"; 

const Expenses = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const [currencyId, setCurrencyId] = useState(
    "11111111-1111-1111-1111-111111111111"
  );
  const [widgetCurrencySymbol, setWidgetCurrencySymbol] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [lastCutoffExpenses, setLastCutoffExpenses] = useState(0);
  const [currentTotalExpense, setCurrentTotalExpense] = useState(0);
  const [totalIssued, setTotalIssued] = useState(0);
  const [currentCutoffExpense, setCurrentCutoffExpense] = useState(0);
  const [selectedCutOff, setSelectedCutOff] = useState({
    id: "All",
    from: null,
    to: null,
  }); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [activekeyTab, setActivekeyTab] = useState("pending");
  const [exportData, setExportData] = useState([]);
  const csvLinkRef = React.useRef();
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // handle change select cutoff date
  const handleSelect = (e) => {
    const selectedValue = e.target.value;

    if (selectedValue === "All") {
      const earliestFrom = new Date(
        Math.min(...cutOffs.map((item) => new Date(item.from).getTime()))
      );
      const latestTo = new Date(
        Math.max(...cutOffs.map((item) => new Date(item.to).getTime()))
      );

      const allCutoff = { id: "All", from: earliestFrom, to: latestTo };

      setSelectedCutOff(allCutoff);

      // Use immediately
      getLastCutoffExpenses(allCutoff);
      getCurrentTotalExpense(allCutoff);
      getTotalIssued(allCutoff);
      getCurrentCutoffExpense(allCutoff);
    } else {
      const selectedItem = cutOffs.find((item) => item.id === selectedValue);

      if (selectedItem) {
        const cutoff = {
          id: selectedItem.id,
          from: new Date(selectedItem.from),
          to: new Date(selectedItem.to),
        };

        setSelectedCutOff(cutoff);

        // Use the cutoff directly
        getLastCutoffExpenses(cutoff);
        getCurrentTotalExpense(cutoff);
        getTotalIssued(cutoff);
        getCurrentCutoffExpense(cutoff);
      }
    }
  };

  const fetchCutOff = async () => {
    // await axios
    //   .get(BASE_URL + "/cutoff/getCutoffs")
    //   .then((res) => {
    //     setCutOffs(res.data);
    //
    //     const latestCutoff = res.data.reduce((latest, current) =>
    //       new Date(current.to) > new Date(latest.to) ? current : latest
    //     );
    //
    //     setSelectedCutOff({
    //       id: latestCutoff.id,
    //       from: new Date(latestCutoff.from),
    //       to: new Date(latestCutoff.to),
    //     });
    //
    //     getLastCutoffExpenses(latestCutoff);
    //     getCurrentTotalExpense(latestCutoff);
    //     getTotalIssued(latestCutoff);
    //     getCurrentCutoffExpense(latestCutoff);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    setSelectedCutOff({
      id: initialCutoff.id,
      from: initialCutoff.from,
      to: initialCutoff.to,
    });

    getLastCutoffExpenses(initialCutoff);
    getCurrentTotalExpense(initialCutoff);
    getTotalIssued(initialCutoff);
    getCurrentCutoffExpense(initialCutoff);
  };

  useEffect(() => {
    fetchCutOff();
    //eslint-disable-next-line
  }, []);

  const getLastCutoffExpenses = async (cutOff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/expenses/fetchLastCutoffExpense`,
        {
          params: {
            startDate: cutOff?.from,
            endDate: cutOff?.to,
            currencyId,
          },
        }
      );
      setLastCutoffExpenses(res.data.totalPrice);
    } catch (error) {
      console.error(error);
    }
  };

  const getCurrentTotalExpense = async (cutOff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/expenses/fetchCurrentTotalExpense`,
        {
          params: {
            startDate: cutOff?.from,
            endDate: cutOff?.to,
            currencyId,
          },
        }
      );
      setCurrentTotalExpense(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getTotalIssued = async (cutOff) => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses/fetchTotalIssued`, {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      });
      setTotalIssued(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getCurrentCutoffExpense = async (cutOff) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/expenses/fetchCurrentCutoffExpense`,
        {
          params: {
            startDate: cutOff?.from,
            endDate: cutOff?.to,
            currencyId,
          },
        }
      );
      setCurrentCutoffExpense(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCutOff();

    //eslint-disable-next-line
  }, []);

  const widgetList = [
    {
      widgetOneTitle: "Last cut-off Expenses",
      widgetOneAmount: lastCutoffExpenses,
      widgetTwoTitle: "Current Total Expense",
      widgetTwoAmount: currentTotalExpense,
    },
    {
      widgetOneTitle: "Total Issued",
      widgetOneAmount: totalIssued,
      widgetTwoTitle: "Current cut-off Expense",
      widgetTwoAmount: currentCutoffExpense,
    },
  ];

  const handleChangeTab = (k) => {
    setActivekeyTab(k);
  };

  // Export function for PDF
  const exportToPdf = async () => {
    swal({
      icon: "warning",
      title: "Export to PDF?",
      text: "Do you want to export this data as a PDF file?",
      dangerMode: true,
      buttons: true,
    }).then(async (confirm) => {
      if (confirm) {
        // Fetch both tabs
        const [pendingRes, approvedRes] = await Promise.all([
          axios.get(`${BASE_URL}/expenses/getExpensesData`, {
            params: {
              startDate: selectedCutOff.from,
              endDate: selectedCutOff.to,
              currencyId,
              status_tab: "For-Approval",
              limit: 100000,
              page: 1,
            },
          }),
          axios.get(`${BASE_URL}/expenses/getExpensesData`, {
            params: {
              startDate: selectedCutOff.from,
              endDate: selectedCutOff.to,
              currencyId,
              status_tab: "Approved",
              limit: 100000,
              page: 1,
            },
          }),
        ]);
        setExportData({
          Pending: pendingRes.data.data || [],
          Approved: approvedRes.data.data || [],
        });
        setShowPdfPreview(true);
      }
    });
  };

  const exportToCsv = async () => {
    swal({
      icon: "warning",
      title: "Export to CSV?",
      text: "Do you want to export this data as a CSV file?",
      dangerMode: true,
      buttons: true,
    }).then(async (confirm) => {
      if (confirm) {
        // Fetch both tabs
        const [pendingRes, approvedRes] = await Promise.all([
          axios.get(`${BASE_URL}/expenses/getExpensesData`, {
            params: {
              startDate: selectedCutOff.from,
              endDate: selectedCutOff.to,
              currencyId,
              status_tab: "For-Approval",
              limit: 100000,
              page: 1,
            },
          }),
          axios.get(`${BASE_URL}/expenses/getExpensesData`, {
            params: {
              startDate: selectedCutOff.from,
              endDate: selectedCutOff.to,
              currencyId,
              status_tab: "Approved",
              limit: 100000,
              page: 1,
            },
          }),
        ]);
        setExportData({
          Pending: pendingRes.data.data || [],
          Approved: approvedRes.data.data || [],
        });
        setTimeout(() => {
          csvLinkRef.current.link.click();
        }, 100);
      }
    });
  };

  const handleDateRangeChange = (startDate, endDate) => {
    const cutoff = {
      id: "custom",
      from: startDate,
      to: endDate,
    };
    setSelectedCutOff(cutoff);
    getLastCutoffExpenses(cutoff);
    getCurrentTotalExpense(cutoff);
    getTotalIssued(cutoff);
    getCurrentCutoffExpense(cutoff);
  };

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
      ) : authrztn.includes("Expenses-View") ? (
        <>
          <div className="w-100 p-2 mb-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">EXPENSES</span>
              {/* <span>LOCAL ACCOUNTS RECEIVABLE</span> */}
            </div>
            <div className="d-flex">
              {/* Export Pdf and excel */}
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-success dropdown-toggle pt-2 px-3 me-2"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Export
                </button>
                <ul className="dropdown-menu">
                  <li
                    className="dropdown-item border-bottom"
                    style={{ cursor: "pointer" }}
                    onClick={() => exportToPdf()}
                  >
                    PDF
                  </li>
                  <li
                    className="dropdown-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => exportToCsv()}
                  >
                    CSV
                  </li>
                </ul>
              </div>
              <ExpensesCsv data={exportData} csvLinkRef={csvLinkRef} />

              {authrztn.includes("Expenses-Add") && (
                <Link
                  to="/accounting/add-expenses/null/null"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              )}
            </div>
          </div>

          <CurrencySelector
            setWidgetCurrencySymbol={setWidgetCurrencySymbol}
            fetchCutOff={fetchCutOff}
            currencyId={currencyId}
            setCurrencyId={setCurrencyId}
            style={{ maxWidth: "8.5rem" }}
          />

          <div className="container-fluid position-relative">
            {/* Widgets */}
            <div className="mt-3 mb-4">
              {widgetList.map((item, index) => (
                <div
                  className="d-flex mb-3"
                  key={index}
                  // ref={(el) => (containerItemRefs.current[index] = el)}
                >
                  {/* Widget Column #1 */}
                  <div className="col-sm w-100 payable-card px-2">
                    <div
                      className="d-flex flex-row align-items-center justify-content-between border p-3 shadow-sm rounded hover-card"
                      style={{
                        cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-2 text-secondary">
                        <i class="bx bx-bar-chart-alt fs-4"></i>
                        <h3 className="fs-6 mb-0">{item.widgetOneTitle}</h3>
                      </div>

                      <div className="d-flex text-nowrap payable-card-desc">
                        <h1
                          className="fs-5 fw-bold mb-0"
                          title={item.widgetOneAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          style={{
                            cursor: "pointer",
                            color: "rgb(40, 209, 40)",
                          }}
                        >
                          {widgetCurrencySymbol}{" "}
                          {item.widgetOneAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </h1>
                      </div>
                    </div>
                  </div>

                  {/* Widget Column #2 */}
                  <div className="col-sm w-100 px-2">
                    <div
                      className="d-flex align-items-center justify-content-between w-100 p-3 border shadow-sm rounded hover-card"
                      style={{
                        cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-2 text-secondary">
                        <i class="bx bx-wallet fs-4 mb-0"></i>
                        <h3 className="fs-6 mb-0">{item.widgetTwoTitle}</h3>
                      </div>

                      <div className="d-flex flex-column text-nowrap payable-card-desc">
                        <h1
                          className="fs-5 fw-bold mb-0"
                          title={item.widgetTwoAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          style={{
                            fontSize: "2rem",
                            cursor: "pointer",
                            color: "rgb(40, 209, 40)",
                          }}
                        >
                          {widgetCurrencySymbol}{" "}
                          {item.widgetTwoAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="container-fluid mt-4 p-0">
              <div className="row mx-auto">
                <div className="col-sm mb-2">
                  <DateRangePicker
                    startDate={selectedCutOff?.from}
                    endDate={selectedCutOff?.to}
                    onDateRangeChange={handleDateRangeChange}
                    label="Date Range"
                  />

                  {/* <span>Cutoff</span>

                  <select
                    value={selectedCutOff?.id}
                    onChange={handleSelect}
                    className="form-select"
                    onMouseDown={(e) => {
                      if (cutOffs.length === 0) {
                        e.preventDefault();
                        swal({
                          icon: "warning",
                          title: "No Cutoff Found",
                          text: "No cutoff records found. Please create a cutoff first in Monthly Cutoff Module.",
                        });
                        return;
                      }
                    }}
                  >
                    <option value="All">All</option>
                    {cutOffs.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select> */}
                </div>
                {/* <div className="col-sm mb-2">
                  <span>From</span>

                  <DatePicker
                    selected={selectedCutOff?.from}
                    dateFormat="MMM/dd/yyyy"
                    className="form-control"
                    readOnly
                  />
                </div>
                <div className="col-sm mb-2">
                  <span>To</span>

                  <DatePicker
                    selected={selectedCutOff?.to}
                    dateFormat="MMM/dd/yyyy"
                    className="form-control"
                    readOnly
                  />
                </div> */}
                <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100"></div>
              </div>
            </div>
            <div className="container-fluid mt-3">
              <Tabs
                defaultActiveKey="pending"
                transition={false}
                id="status-tabs"
                className="mb-3"
                activeKey={activekeyTab}
                onSelect={handleChangeTab}
              >
                <Tab eventKey="pending" title="Pending">
                  {activekeyTab === "pending" && (
                    <PendingStatusTab
                      authrztn={authrztn}
                      currencyId={currencyId}
                      userLoggedID={userLoggedID}
                      selectedCutOff={selectedCutOff}
                      status_tab={"For-Approval"}
                    />
                  )}
                </Tab>
                <Tab eventKey="approved" title="Approved">
                  {activekeyTab === "approved" && (
                    <PendingStatusTab
                      authrztn={authrztn}
                      currencyId={currencyId}
                      userLoggedID={userLoggedID}
                      selectedCutOff={selectedCutOff}
                      status_tab={"Approved"}
                    />
                  )}
                </Tab>
              </Tabs>
            </div>
          </div>

          {/* PDF Preview Modal */}
          <Modal
            show={showPdfPreview}
            size="xl"
            onHide={() => setShowPdfPreview(false)}
          >
            <div className="position-relative">
              <PDFDownloadLink
                document={<ExpensesPdf data={exportData} />}
                fileName={`Expenses List.pdf`}
              >
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip
                      id="tooltip-right"
                      className="me-2"
                      style={{ fontSize: "0.8rem" }}
                    >
                      Download as{" "}
                      <strong className="text-danger">Expenses PDF</strong>
                    </Tooltip>
                  }
                  delay={300}
                >
                  <Button
                    variant="light"
                    className="position-absolute btn btn-light border border-4 border-secondary mb-5 rounded-5"
                    style={{ bottom: "7rem", left: "2rem" }}
                  >
                    <i className="fa-solid fa-download"></i>
                  </Button>
                </OverlayTrigger>
              </PDFDownloadLink>
              <PDFViewer style={{ width: "100%", height: "100vh" }}>
                <ExpensesPdf data={exportData} />
              </PDFViewer>
            </div>
          </Modal>
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

export default Expenses;
