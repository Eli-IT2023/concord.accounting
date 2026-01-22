import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { Link, useNavigate } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import swal from "sweetalert";
import DateRangePicker from "../../components/DateRangePicker";
import { getMonthBoundaries, initializeCutoff } from "../../utils/newdate";

const StockTransfer = ({ authrztn }) => {
  const navigate = useNavigate();

  // filter

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [stockTransferList, setStockTransferList] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    dateFrom: "",
    dateTo: "",
  });
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date

  const handleCutoffChange = (value) => {
    let filteredCutoff;
    if (value === "All Cutoff" || !value) {
      const ascendingSortedCutoff = cutOffs.sort(
        (a, b) => new Date(b.from) - new Date(a.from)
      );
      filteredCutoff = {
        from: ascendingSortedCutoff[ascendingSortedCutoff.length - 1]?.from,
        to: ascendingSortedCutoff[0]?.to,
      };
    } else {
      [filteredCutoff] = cutOffs.filter((item) => {
        return item.id == value;
      });
    }
    return filteredCutoff;
  };

  // handle change select cutoff date
  const handleSelect = (e) => {
    const filteredCutoff = handleCutoffChange(e.target.value);
    setSearchText("");
    pagination.setCurrentPage(1);

    setSelectedCutOff(filteredCutoff);
    fetchStockTransferList(filteredCutoff);
  };

  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const filteredCutoff = handleCutoffChange(selectedCutOff?.id);

    setCutOffDate(filteredCutoff); // set state for input date
  }, [cutOffs, selectedCutOff]);

  useEffect(() => {
    startAndEndDate();
  }, [selectedCutOff]);

  const fetchCutoff = async () => {
    // try {
    //   const res = await axios.get(BASE_URL + "/outstanding/getCutoffs");
    //   let defaultCutOff = res.data[0];
    //   // get the latest date for default cut off
    //   for (let index = 1; index < res.data.length; index++) {
    //     if (res.data[index].to > defaultCutOff.to) {
    //       defaultCutOff = res.data[index];
    //     }
    //   }
    //   if (selectedCutOff) {
    //     const filteredCutoff = handleCutoffChange(selectedCutOff?.id);

    //     setSelectedCutOff(filteredCutoff); // set default cut off
    //     fetchStockTransferList(filteredCutoff);
    //   } else {
    //     setCutOffs(res.data);
    //     setSelectedCutOff(defaultCutOff); // set default cut off
    //     fetchStockTransferList(defaultCutOff);
    //   }
    // } catch (error) {
    //   console.log(error);
    // }

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    setSelectedCutOff(initialCutoff);
    setCutOffDate(initialCutoff);
    fetchStockTransferList(initialCutoff);
  };

  useEffect(() => {
    fetchCutoff();
  }, []);

  const handleDateChange = (e) => {
    setDateFilter((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const pagination = useServerPagination(
    BASE_URL + "/stock_transfer/getStockTransfer",
    10
  );

  const fetchStockTransferList = (cutOff) => {
    pagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      filterColumn,
      searchText,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/stock_transfer/getStockTransfer", {
    //     params: {
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     setStockTransferList(res.data);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => console.log(err));
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchStockTransferList();
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, []);

  useEffect(() => {
    setStockTransferList(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    fetchCutoff();
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  const columns = [
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_id,
    },
    {
      name: "From",
      selector: (row) => row.warehouse_from.name,
    },
    {
      name: "To",
      selector: (row) => row.warehouse_to.name,
    },
    {
      name: "Date Transfered",
      selector: (row) => format(row.date_transfer, "MMM/dd/yyyy"),
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
    {
      name: "Action",
      selector: (row) => (
        <i
          className="fas fa-trash text-center"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() =>
            handleDeleteStockTransfer(row.id, row.warehouse_from_id, row.status)
          }
        ></i>
      ),
    },
  ];

  console.log(stockTransferList);

  const handleDeleteStockTransfer = async (id, warehouse_id, status) => {
    try {
      swal({
        icon: "warning",
        title: "Confirm Deletion",
        text: "Are you sure you want to delete?",
        dangerMode: true,
        buttons: ["Cancel", "OK"],
      })
        .then(async (confirm) => {
          if (confirm) {
            const res = await axios.delete(
              `${BASE_URL}/stock_transfer/deleteStockTransfer/${id}`,
              {
                params: {
                  warehouse_id: warehouse_id,
                  status: status,
                },
              }
            );

            if (res.status === 200) {
              swal({
                icon: "success",
                title: "Successfully Deleted",
                text: "Stock Transfer Successfully Deleted.",
              }).then(() => {
                const [filteredCutoff] = cutOffs.filter((item) => {
                  return item.id == selectedCutOff?.id;
                });
                fetchStockTransferList(filteredCutoff);
              });
              return;
            }
          }
        })
        .catch((error) => {
          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "error",
            timer: 2000,
          });
          console.error(error);
        });
    } catch (error) {
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
        timer: 2000,
      });
      console.error(error);
    }
  };

  const handleDateRangeChange = (startDate, endDate) => {
    const cutoff = {
      id: "custom",
      from: startDate,
      to: endDate,
    };
    setSelectedCutOff(cutoff);
    setCutOffDate(cutoff);
    setSearchText("");
    pagination.setCurrentPage(1);
    fetchStockTransferList(cutoff);
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
      ) : authrztn.includes("StockTransfer-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">STOCK TRANSFER</span>
              <span>STOCK COUNTING</span>
            </div>
            {authrztn.includes("StockTransfer-Add") && (
              <div>
                <Link
                  to="/inventory/create-stock-transfer"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              </div>
            )}
          </div>
          <div className="container-fluid mt-4 p-0">
            <div className="row mx-auto">
              {/* <div className="col-sm mb-2">
                <span>From</span>
                <input
                  type="date"
                  name="dateFrom"
                  id="dateFrom"
                  value={dateFilter.dateFrom}
                  className="form-control"
                  onChange={handleDateChange}
                />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
                <input
                  type="date"
                  name="dateTo"
                  id="dateTo"
                  min={dateFilter.dateFrom}
                  value={dateFilter.dateTo}
                  className="form-control"
                  onChange={handleDateChange}
                />
              </div> */}
              <div className="col-sm">
                <DateRangePicker
                  startDate={
                    cutOffDate?.from ? new Date(cutOffDate.from) : null
                  }
                  endDate={cutOffDate?.to ? new Date(cutOffDate.to) : null}
                  onDateRangeChange={handleDateRangeChange}
                  label="Date Range"
                />
                {/* <label htmlFor="cutoff">Cutoff</label>
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select"
                  id="cutoff"
                  aria-label="Default select example"
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
                  <option value="All Cutoff">All</option>
                  {cutOffs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select> */}
              </div>
              {/* <div className="col-sm">
                <label htmlFor="cutoff-start-date">From</label>
                <input
                  type="date"
                  value={cutOffDate?.from || ""}
                  readOnly
                  name="cutoff-start-date"
                  id="cutoff-start-date"
                  className="form-control"
                />
                <DatePicker
                  selected={cutOffDate?.from}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm">
                <label htmlFor="cutoff-end-date">To</label>
                <input
                  type="date"
                  value={cutOffDate?.to || ""}
                  readOnly
                  name="cutoff-end-date"
                  id="cutoff-end-date"
                  className="form-control"
                />
                <DatePicker
                  selected={cutOffDate?.to}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div> */}
              {/* <div className="col-sm d-none flex-row align-items-end mb-2 filter-btn-container w-100">
                <button className="btn w-100 d-none">Apply Filter</button>
                <button
                  className="btn btn-secondary w-100"
                  onClick={() => {
                    setDateFilter({
                      dateFrom: "",
                      dateTo: "",
                    });
                  }}
                >
                  Clear Filter
                </button>
              </div> */}
              {/* <div className="col-sm mb-2"></div> */}
              <div className="col-sm mb-2"></div>
            </div>
          </div>
          <div className="w-100 mt-3 mb-2 container-fluid">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
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
                    onClick={() => setFilterColumn("all")}
                  >
                    All
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "transaction_id" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("transaction_id")}
                  >
                    Transaction ID
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "from" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("from")}
                  >
                    From
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "to" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("to")}
                  >
                    To
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "date_transfer" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("date_transfer")}
                  >
                    Date Transfered
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "status" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("status")}
                  >
                    Status
                  </button>
                </li>
              </ul>
            </div>
          </div>
          {/* data table */}
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              onRowClicked={(row) => {
                navigate(`/inventory/view-stock-transfer/${row.id}`);
              }}
              columns={columns}
              customStyles={customStyles}
              data={stockTransferList}
              className="dataTable"
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

export default StockTransfer;
