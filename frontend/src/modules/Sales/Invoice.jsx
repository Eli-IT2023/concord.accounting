import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import { format } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import DataTable from "react-data-table-component";
import DatePicker from "react-datepicker";
import { ThreeDot } from "react-loading-indicators";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert";
import BASE_URL from "../../assets/global/url";
import NoAccess from "../../assets/img/NoAccess.png";
import { customStyles } from "../../assets/table-style";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

const Invoice = ({ authrztn }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const [salesData, setSalesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [cutOffDisplayData, setCutOffDisplayData] = useState(null);
  const [filteredSalesInvoiceData, setFilteredSalesInvoiceData] = useState([]);
  // const [bulkCollectionPaymentData, setBulkCollectionPaymentData] = useState(
  //   []
  // );
  const [selectedCutOff, setSelectedCutOff] = useState("");
  const [cutOffs, setCutOffs] = useState([]);
  const [cutOffDate, setCutOffDate] = useState("");
  const [widget, setWidget] = useState({});
  const [lastCutOffReceivableModal, setLastCutOffReceivableModal] = useState(
    []
  );
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // handle change select cutoff date
  const handleSelect = (e) => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id == e.target.value;
    });

    setSelectedCutOff(filteredCutoff);
    fetchSalesInvoiceData(filteredCutoff);
    fetchLastCutoffModal(filteredCutoff);
  };

  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id === selectedCutOff?.id;
    });

    setCutOffDate(filteredCutoff); // set state for input date
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
      name: "Transaction ID",
      id: "sales",
      selector: (row) => row.transaction_id,
    },
    {
      name: "Destination",
      selector: (row) => row.destination,
    },
    {
      name: "Container Number",
      id: "sales",
      selector: (row) => row.container_number,
      cell: (row) => <div>{row.container_number || "n/a"}</div>,
    },
    {
      name: "Pier",
      id: "sales",
      selector: (row) => row.pier,
      cell: (row) => <div>{row.pier || "n/a"}</div>,
    },
    {
      name: "Customer",
      id: "sales",
      selector: (row) => `${row.customer.first_name} ${row.customer.last_name}`,
    },
    {
      name: "Invoice Date",
      id: "sales",
      selector: (row) => format(row.invoice_date, "MMM dd, yyyy"),
    },
    {
      name: "Due Date",
      id: "sales",
      selector: (row) => {
        const daysDifference = calculateDaysDifference(
          row.createdAt,
          row.due_date
        );
        return `In ${daysDifference} Day(s)`;
      },
    },
    {
      name: "Currency",
      id: "sales",
      selector: (row) => row.currency.currency_name,
    },
    {
      name: "Total Amount",
      id: "sales",
      selector: (row) =>
        row.total_amount?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let color;
        switch (row.status) {
          case "Pending":
            color = "#FFA500";
            break;
          case "Approved":
            color = "#3B9F3F";
            break;
          case "Rejected":
            color = "#FF0000";
            break;
          default:
            color = "initial";
        }
        return (
          <div
            style={{
              padding: "5px 10px",
              borderRadius: "5px",
              color: color,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            {row.status}
          </div>
        );
      },
    },
  ];
  if (authrztn.includes("Invoices-Delete")) {
    columns.push({
      name: "Action",
      selector: (row) => (
        <i
          className="fas fa-trash"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() => {
            handleDeleteInvoice(row.sales_invoice_id, row.invoice_date, row);
            console.log(row);
          }}
        ></i>
      ),
    });
  }

  const handleDeleteInvoice = async (invoiceId, invoice_date, rowData) => {
    swal({
      title: "Confirm Deletion",
      text: "Are you sure you want to delete?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          const response = await axios.delete(
            `${BASE_URL}/invoice/deleteInvoice/${invoiceId}/${invoice_date}`,
            {
              data: { userLoggedID, rowData },
            }
          );
          if (response.status === 200) {
            swal({
              title: "Invoice Deleted Successfully!",
              text: "The invoice has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              fetchSalesInvoiceData();
              fetchCutOff();
            });
          } else if (response.status === 203) {
            const { transactionNumber, moduleType } = response.data;
            let moduleFrom;
            if (moduleType == "Local-Bulk-Collection") {
              moduleFrom = "Local Collection";
            } else {
              moduleFrom = "Overseas Collection";
            }
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the invoice in module <strong>${moduleFrom}</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 202) {
            const { invoiceDate, CutoffName } = response.data;
            swal({
              title: "Delete Prohibited!",
              text: `Invoice cannot be deleted as its invoice date (${invoiceDate}) falls within the posted cutoff period named "${CutoffName}".`,
              icon: "warning",
              button: "OK",
            });
          } else {
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact our support team for assistance.",
            });
          }
        } catch (err) {
          console.log(err);
          swal({
            icon: "error",
            title: "Error",
            text: "An error occurred while deleting the invoice.",
          });
        }
      }
    });
  };

  const modalColumns = [
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_id,
    },
    {
      name: "Destination",
      selector: (row) => row.destination,
    },
    {
      name: "Customer",
      selector: (row) => `${row.customer.first_name} ${row.customer.last_name}`,
    },
    {
      name: "Invoice Date",
      selector: (row) => row.invoice_date,
    },
    {
      name: "Due Date",
      selector: (row) => {
        const daysDifference = calculateDaysDifference(
          row.createdAt,
          row.due_date
        );
        return `In ${daysDifference} Day(s)`;
      },
    },
    {
      name: "Currency",
      selector: (row) => row.currency.currency_name,
    },
    {
      name: "Total Amount",
      selector: (row) =>
        row.total_amount?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
  ];

  const fetchCutOff = () => {
    axios
      .get(BASE_URL + "/invoice/getCutoffForDisplay")
      .then((res) => {
        let defaultCutOff = res.data[0];
        for (let index = 1; index < res.data.length; index++) {
          if (res.data[index].to > defaultCutOff.to) {
            defaultCutOff = res.data[index];
          }
        }
        if (selectedCutOff) {
          const [filteredCutoff] = cutOffs.filter((item) => {
            return item.id == selectedCutOff?.id;
          });
          setSelectedCutOff(filteredCutoff); // set default cut off
          fetchSalesInvoiceData(filteredCutoff);
          setCutOffDisplayData(filteredCutoff);
          fetchLastCutoffModal(filteredCutoff);
        } else {
          setCutOffs(res.data); // store all cut off
          setSelectedCutOff(defaultCutOff); // set default cut off
          fetchSalesInvoiceData(defaultCutOff);
          setCutOffDisplayData(defaultCutOff);
          fetchLastCutoffModal(defaultCutOff);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (cutOffDisplayData && salesData?.length > 0) {
      const fromDate = new Date(cutOffDisplayData.from);
      const toDate = new Date(cutOffDisplayData.to);

      const filtered = salesData.filter((row) => {
        const invoiceDate = new Date(row.invoice_date);
        return invoiceDate >= fromDate && invoiceDate <= toDate;
      });

      setFilteredSalesInvoiceData(filtered);
    }
  }, [cutOffDisplayData, salesData]);

  const pagination = useServerPagination(
    BASE_URL + "/invoice/getSalesData",
    10
  );

  const fetchSalesInvoiceData = (cutOff) => {
    pagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      filterColumn,
      searchTerm,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/invoice/getSalesData", {
    //     params: {
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       filterColumn,
    //       searchTerm,
    //     },
    //   })
    //   .then((res) => {
    //     const {
    //       data,
    //       lastCutoffReceivable,
    //       currentSalesTotal,
    //       currentTotalDiscount,
    //       totalCollection,
    //       currentCutoffReceivable,
    //     } = res.data;
    //     setSalesData(data);
    //     console.log(data);
    //     setWidget((prev) => ({
    //       ...prev,
    //       lastCutOffReceivable: lastCutoffReceivable,
    //       currentSalesTotal: currentSalesTotal,
    //       currentTotalDiscount: currentTotalDiscount,
    //       totalCollection: totalCollection,
    //       currentCutOffReceivable: currentCutoffReceivable,
    //     }));
    //     setIsLoading(false);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     setIsLoading(true);
    //   });
  };

  const paginationForLastCutoff = useServerPagination(
    `${BASE_URL}/invoice/fetchLastCutoffModal`,
    10
  );

  const fetchLastCutoffModal = async (cutOff) => {
    paginationForLastCutoff.updateParams({
      startDate: cutOff?.from,
    });
    // const res = await axios.get(`${BASE_URL}/invoice/fetchLastCutoffModal`, {
    //   params: {
    //     startDate: cutOff?.from,
    //   },
    // });
    // setLastCutOffReceivableModal(res.data);
  };

  // const handleSearch = (query, column = "") => {
  //   setSearchTerm(query);
  //   if (query.trim() === "") {
  //     fetchSalesInvoiceData(selectedCutOff);
  //     return;
  //   }
  //   axios
  //     .get(`${BASE_URL}/invoice/searchSalesData`, {
  //       params: {
  //         query,
  //         filterColumn: column || filterColumn,
  //       },
  //     })
  //     .then((res) => {
  //       setSalesData(res.data);
  //       setIsLoading(false);
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //       setIsLoading(false);
  //     });
  // };

  const handleFilterColumnSelect = (column) => {
    setFilterColumn(column);
    // if (searchTerm) {
    //   handleSearch(searchTerm, column);
    // }
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchCutOff();
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, []);

  useEffect(() => {
    setLastCutOffReceivableModal(paginationForLastCutoff.data);
    console.log(paginationForLastCutoff, "lastcutoff");
  }, [paginationForLastCutoff]);

  useEffect(() => {
    const {
      data,
      lastCutoffReceivable,
      currentSalesTotal,
      currentTotalDiscount,
      totalCollection,
      currentCutoffReceivable,
    } = pagination.data;

    setSalesData(data);
    setWidget((prev) => ({
      ...prev,
      lastCutOffReceivable: lastCutoffReceivable,
      currentSalesTotal: currentSalesTotal,
      currentTotalDiscount: currentTotalDiscount,
      totalCollection: totalCollection,
      currentCutOffReceivable: currentCutoffReceivable,
    }));
  }, [pagination.data]);

  useEffect(() => {
    fetchCutOff();
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

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
                    <i className="bx bx-plus fs-5"></i> Create
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="container-fluid">
            <div className="row p-2 mx-auto">
              <div className="col-sm w-100 p-3 payable-card">
                <div
                  className="w-100 border p-3 shadow-sm rounded h-100"
                  style={{ cursor: "pointer" }}
                  onClick={handleShow}
                >
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                    <h3 className="fs-5">Last Cutoff Receivable</h3>
                  </div>

                  <div className="mt-3 d-flex flex-column text-nowrap payable-card-desc">
                    <p
                      className="payable-amount"
                      style={{ color: "orange", fontSize: "2rem" }}
                    >
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
                    <h3 style={{ fontSize: "1.3rem" }}>Current Sales Total</h3>
                  </div>

                  <div className=" mt-3 d-flex flex-column text-nowrap payable-card-desc">
                    <p
                      className="payable-amount"
                      style={{ color: "green", fontSize: "2rem" }}
                    >
                      {widget.currentSalesTotal?.toLocaleString("en-US", {
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
                    <h3 className="fs-4 text-nowrap">Total Discount</h3>
                  </div>

                  <div
                    style={{ marginTop: "2.3rem" }}
                    className="d-flex flex-column text-nowrap payable-card-desc"
                  >
                    <p
                      className="payable-amount"
                      style={{ color: "orange", fontSize: "2rem" }}
                    >
                      {widget.currentTotalDiscount?.toLocaleString("en-US", {
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
                    <h3 className="fs-4">Collection</h3>
                  </div>

                  <div
                    style={{ marginTop: "2.2rem" }}
                    className="d-flex flex-column payable-card-desc"
                  >
                    <p
                      className="payable-amount"
                      style={{ color: "green", fontSize: "2rem" }}
                    >
                      {widget.totalCollection?.toLocaleString("en-US", {
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
                    <i class="bx bx-credit-card fs-4 h-100"></i>
                    <h3 className="fs-5">Current Cutoff Receivable</h3>
                  </div>

                  <div className="mt-3 d-flex flex-column payable-card-desc">
                    <p
                      className="payable-amount"
                      style={{ color: "gray", fontSize: "2rem" }}
                    >
                      {widget.currentCutOffReceivable?.toLocaleString("en-US", {
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

                {/* <input
                  type="date"
                  value={cutOffDate?.from || ""}
                  readOnly
                  name="cutoff-start-date"
                  id="cutoff-start-date"
                  className="form-control"
                /> */}
                <div>
                  <DatePicker
                    selected={cutOffDate?.from}
                    dateFormat="MMM dd, yyyy"
                    className="form-control"
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">To</label>
                {/* <input
                  type="date"
                  readOnly
                  value={cutOffDate?.to || ""}
                  name="cutoff-end-date"
                  id="cutoff-end-date"
                  className="form-control"
                /> */}
                <div>
                  <DatePicker
                    selected={cutOffDate?.to}
                    dateFormat="MMM dd, yyyy"
                    className="form-control"
                    readOnly
                  />
                </div>
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
                  // placeholder={
                  //   filterColumn === "all"
                  //     ? "Search"
                  //     : `Search by ${filterColumn}...`
                  // }
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                        filterColumn === "all" ? "active" : ""
                      }`}
                      onClick={() => handleFilterColumnSelect("all")}
                    >
                      All
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
            <div
              className="w-100 mt-3 container-fluid"
              style={{ maxWidth: "78.5vw" }}
            >
              <DataTable
                columns={columns}
                data={salesData}
                customStyles={customStyles}
                className="dataTable"
                onRowClicked={handleUpdateInvoice}
              />
              <PaginationControls {...pagination} />
            </div>
          </div>

          {/* Last Cutoff Receivable Modal */}
          <Modal
            show={show}
            onHide={handleClose}
            backdrop="static"
            keyboard={false}
            centered
            size="xl"
          >
            <Modal.Header closeButton>
              <Modal.Title>Last Cutoff Receivable</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <DataTable
                columns={modalColumns}
                data={lastCutOffReceivableModal}
                customStyles={customStyles}
                className="dataTable"
              />
              <PaginationControls {...paginationForLastCutoff} />
            </Modal.Body>
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

export default Invoice;
