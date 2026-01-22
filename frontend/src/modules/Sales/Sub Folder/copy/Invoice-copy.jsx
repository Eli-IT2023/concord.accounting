import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../assets/global/url";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../../../assets/img/NoAccess.png";

const InvoiceCopy = ({ authrztn }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [salesData, setSalesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cutOffDisplayData, setCutOffDisplayData] = useState(null);
  const [filteredSalesInvoiceData, setFilteredSalesInvoiceData] = useState([]);

  const [selectedCutOff, setSelectedCutOff] = useState("");
  const [cutOffs, setCutOffs] = useState([]);
  const [cutOffDate, setCutOffDate] = useState("");
  const [widget, setWidget] = useState({});

  const handleSelect = (e) => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id == e.target.value;
    });

    setSelectedCutOff(filteredCutoff);
    fetchSalesInvoiceData(filteredCutoff);
  };

  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id === selectedCutOff?.id;
    });

    setCutOffDate(filteredCutoff);
  }, [cutOffs, selectedCutOff]);

  useEffect(() => {
    startAndEndDate();
  }, [selectedCutOff]);

  function calculateDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDifference = end.getTime() - start.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    return daysDifference;
  }

  const columns = [
    {
      name: "TRANSACTION ID",
      selector: (row) => row.transaction_id,
    },
    {
      name: "DESTINATION",
      selector: (row) => row.destination,
    },
    {
      name: "CUSTOMER",
      selector: (row) => `${row.customer.first_name} ${row.customer.last_name}`,
    },
    {
      name: "INVOICE DATE",
      selector: (row) => row.invoice_date,
    },
    {
      name: "DUE DATE",
      selector: (row) => {
        const daysDifference = calculateDaysDifference(
          row.createdAt,
          row.due_date
        );
        return `In ${daysDifference} Day(s)`;
      },
    },
    {
      name: "CURRENCY",
      selector: (row) => row.currency.currency_name,
    },
    {
      name: "TOTAL AMOUNT",
      selector: (row) =>
        row.total_amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "STATUS",
      selector: (row) => row.status,
      cell: (row) => (
        <div
          style={{
            padding: "5px 10px",
            borderRadius: "5px",
            color: row.status
              ? row.status === "Approved"
                ? "#3B9F3F"
                : "#ff1c1c"
              : "initial",
            textTransform: "uppercase",
          }}
        >
          {row.status || ""}
        </div>
      ),
    },
  ];

  const fetchCutOff = () => {
    axios
      .get(BASE_URL + "/invoice/getCutoffForDisplay")
      .then((res) => {
        let defaultCutOff = res.data[0];
        // get the latest date for default cut off
        for (let index = 1; index < res.data.length; index++) {
          if (res.data[index].to > defaultCutOff.to) {
            defaultCutOff = res.data[index];
          }
        }
        setCutOffs(res.data); // store all cut off
        setSelectedCutOff(defaultCutOff); // set default cut off
        fetchSalesInvoiceData(defaultCutOff);
        setCutOffDisplayData(defaultCutOff);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (cutOffDisplayData && salesData.length > 0) {
      const fromDate = new Date(cutOffDisplayData.from);
      const toDate = new Date(cutOffDisplayData.to);

      const filtered = salesData.filter((row) => {
        const invoiceDate = new Date(row.invoice_date);
        return invoiceDate >= fromDate && invoiceDate <= toDate;
      });

      setFilteredSalesInvoiceData(filtered);
    }
  }, [cutOffDisplayData, salesData]);

  const fetchSalesInvoiceData = (cutOff) => {
    axios
      .get(BASE_URL + "/invoice/getSalesDataNotification", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          id,
        },
      })
      .then((res) => {
        const {
          data,
          lastCutoffReceivable,
          currentSalesTotal,
          currentTotalDiscount,
          totalCollection,
          currentCutoffReceivable,
        } = res.data;
        setSalesData(data);
        setWidget((prev) => ({
          ...prev,
          lastCutOffReceivable: lastCutoffReceivable,
          currentSalesTotal: currentSalesTotal,
          currentTotalDiscount: currentTotalDiscount,
          totalCollection: totalCollection,
          currentCutOffReceivable: currentCutoffReceivable,
        }));
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(true);
      });
  };

  const handleSearch = (query, column = "") => {
    setSearchTerm(query);
    if (query.trim() === "") {
      fetchSalesInvoiceData(selectedCutOff);
      return;
    }
    axios
      .get(`${BASE_URL}/invoice/searchSalesData`, {
        params: {
          query,
          filterColumn: column || filterColumn,
        },
      })
      .then((res) => {
        setSalesData(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const handleFilterColumnSelect = (column) => {
    setFilterColumn(column);
    if (searchTerm) {
      handleSearch(searchTerm, column);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCutOff();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateInvoice = (row) => {
    navigate(`/sales/invoice-update/${row.sales_invoice_id}`);
  };

  //last cutoff receivable
  // const lastCutoffReceivable = salesData
  //   .filter((row) => {
  //     if (row.status !== "Approved" || !cutOffDisplayData) return false;

  //     const invoiceDate = new Date(row.invoice_date);
  //     const fromDate = new Date(cutOffDisplayData.from);
  //     const toDate = new Date(cutOffDisplayData.to);

  //     return invoiceDate < fromDate || invoiceDate > toDate;
  //   })
  //   .reduce((total, row) => total + parseFloat(row.total_amount), 0);

  //current sales total
  // const currentSalesTotal = salesData
  //   .filter((row) => {
  //     if (!cutOffDisplayData) return false;

  //     const invoiceDate = new Date(row.invoice_date);
  //     const fromDate = new Date(cutOffDisplayData.from);
  //     const toDate = new Date(cutOffDisplayData.to);

  //     return (
  //       (row.status === "Approved" || row.status === "Collected") &&
  //       invoiceDate >= fromDate &&
  //       invoiceDate <= toDate
  //     );
  //   })
  //   .reduce((total, row) => total + parseFloat(row.total_amount), 0);

  //current total discount
  // const currentTotalDiscount = salesData
  //   .filter((row) => {
  //     if (!cutOffDisplayData) return false;
  //     const invoiceDate = new Date(row.invoice_date);
  //     const fromDate = new Date(cutOffDisplayData?.from);
  //     const toDate = new Date(cutOffDisplayData?.to);
  //     return (
  //       (row.status === "Approved" || row.status === "Collected") &&
  //       invoiceDate >= fromDate &&
  //       invoiceDate <= toDate
  //     );
  //   })
  //   .reduce(
  //     (total, row) =>
  //       total +
  //       parseFloat(row.transaction_discount || 0) +
  //       parseFloat(row.item_discount || 0),
  //     0
  //   );

  //total collection
  // const totalCollection = bulkCollectionPaymentData
  //   .filter((row) => {
  //     if (!cutOffDisplayData) return false;

  //     const invoiceDate = new Date(row.date_issued);
  //     const fromDate = new Date(cutOffDisplayData.from);
  //     const toDate = new Date(cutOffDisplayData.to);

  //     return (
  //       invoiceDate >= fromDate &&
  //       invoiceDate <= toDate &&
  //       row.status === "Claimed"
  //     );
  //   })
  //   .reduce((total, row) => total + parseFloat(row.amount), 0);

  //current cutoff receivable
  // const currentCutoffReceivable = bulkCollectionPaymentData
  //   .filter((row) => {
  //     if (!cutOffDisplayData) return false;

  //     const invoiceDate = new Date(row.date_issued);
  //     const fromDate = new Date(cutOffDisplayData.from);
  //     const toDate = new Date(cutOffDisplayData.to);

  //     return (
  //       invoiceDate >= fromDate &&
  //       invoiceDate <= toDate &&
  //       row.status === "Approved"
  //     );
  //   })
  //   .reduce((total, row) => total + parseFloat(row.amount), 0);

  // const currentCutoffReceivable = salesData
  //   .filter((row) => {
  //     if (!cutOffDisplayData) return false;

  //     const invoiceDate = new Date(row.invoice_date);
  //     const fromDate = new Date(cutOffDisplayData.from);
  //     const toDate = new Date(cutOffDisplayData.to);

  //     return (
  //       row.status === "Approved" &&
  //       invoiceDate >= fromDate &&
  //       invoiceDate <= toDate
  //     );
  //   })
  //   .reduce((total, row) => total + parseFloat(row.total_amount), 0);

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
      ) : authrztn.includes("Invoices-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom w-100">
              <span className="fs-3">SALES | INVOICE</span>
            </div>

            <div className=" w-100 row">
              <div className="col-12 col-md-8 d-flex flex-row align-items-center mb-2"></div>
              <div className="col-12 col-md-4 d-flex justify-content-end mb-2">
                {authrztn.includes("Invoices-Add") && (
                  <Link
                    to="/sales/create-invoice"
                    className="btn btn-primary d-flex flex-row align-items-center title-button"
                  >
                    <i className="bx bx-plus fs-5"></i> CREATE
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="container-fluid">
            <div className="row p-2 mx-auto">
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                    <h3 style={{ fontSize: "1rem" }}>Last Cutoff Receivable</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <p style={{ color: "orange", fontSize: "2.5rem" }}>
                      {widget.lastCutOffReceivable?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || 0.0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-money-withdraw fs-3 h-100"></i>
                    <h3 style={{ fontSize: "19px" }}>Current Sales Total</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <p style={{ color: "green", fontSize: "2.5rem" }}>
                      {widget.currentSalesTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || 0.0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bxs-discount fs-3 h-100"></i>
                    <h3 style={{ fontSize: "19px" }}>Total Discount</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <p style={{ color: "orange", fontSize: "2.5rem" }}>
                      {widget.currentTotalDiscount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || 0.0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-money fs-3 h-100"></i>
                    <h3 style={{ fontSize: "19px" }}>Collection</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <p style={{ color: "green", fontSize: "2.5rem" }}>
                      {widget.totalCollection.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || 0.0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-credit-card fs-3 h-100"></i>
                    <h3 style={{ fontSize: "1rem" }}>
                      Current Cutoff Receivable
                    </h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <p style={{ color: "gray", fontSize: "2.5rem" }}>
                      {widget.currentCutOffReceivable.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || 0.0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="row mx-auto mt-2">
              {/* <div className="col-sm mb-2">
                <label htmlFor="">Currency</label>
                <select name="" id="" className="form-select">
                  <option value="" selected disabled>
                    Select Currency
                  </option>
                  {currency_db.map((data) => (
                    <option value={data.id}>{data.currency_name}</option>
                  ))}
                </select>
              </div> */}
              <div className="col-12 col-md-3">
                <h6>Cutoff</h6>
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select"
                  aria-label="Default select example"
                >
                  {cutOffs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">From</label>

                <input
                  type="date"
                  value={cutOffDate?.from || ""}
                  readOnly
                  name="cutoff-start-date"
                  id="cutoff-start-date"
                  className="form-control"
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">To</label>
                <input
                  type="date"
                  readOnly
                  value={cutOffDate?.to || ""}
                  name="cutoff-end-date"
                  id="cutoff-end-date"
                  className="form-control"
                />
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button className="btn w-100">Apply Filter</button>
                <button className="btn btn-secondary w-100">
                  Clear Filter
                </button> */}
              </div>
              <div className="col-sm"></div>
            </div>
            <div className="w-100 mt-2 container-fluid">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    filterColumn
                      ? `Search by ${filterColumn}...`
                      : "Search all fields..."
                  }
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary dropdown-toggle-split"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-sliders"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button
                      className={`dropdown-item ${
                        !filterColumn ? "active" : ""
                      }`}
                      onClick={() => handleFilterColumnSelect("")}
                    >
                      All Fields
                    </button>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  {[
                    { value: "transaction_id", label: "Transaction ID" },
                    { value: "destination", label: "Destination" },
                    { value: "customer", label: "Customer" },
                    { value: "invoice_date", label: "Invoice Date" },
                    { value: "due_date", label: "Due Date" },
                    { value: "currency", label: "Currency" },
                    { value: "totalAmount", label: "Total Amount" },
                    { value: "status", label: "Status" },
                  ].map(({ value, label }) => (
                    <li key={value}>
                      <button
                        className={`dropdown-item ${
                          filterColumn === value ? "active" : ""
                        }`}
                        onClick={() => handleFilterColumnSelect(value)}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* data table */}
            <div className="w-100 mt-3 container-fluid">
              <DataTable
                columns={columns}
                data={salesData}
                customStyles={customStyles}
                pagination
                className="dataTable"
                onRowClicked={handleUpdateInvoice}
              />
            </div>
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

export default InvoiceCopy;
