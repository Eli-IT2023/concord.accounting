import React, { useState, useEffect, useCallback } from "react";
import DataTable from "react-data-table-component";
import "../../assets/css/style.css";
import { customStyles } from "../styles/table-style";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import DatePicker from "react-datepicker";
import { compactNumberFormat } from "../../utils/numberFormatter";
import DateRangePicker from "../../components/DateRangePicker";
import { getMonthBoundaries, initializeCutoff } from "../../utils/newdate";

const FixedAsset = ({ authrztn }) => {
  const navigate = useNavigate();

  const userLoggedID = useDecodeToken();

  const [inboundData, setInboundData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
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
    reloadTable(filteredCutoff);
  };

   const fetchCutOff = () => {
    // axios
    //   .get(BASE_URL + "/cutoff/getCutoffs")
    //   .then((res) => {
    //     let defaultCutOff = res.data[0];
    //     // get the latest date for default cut off
    //     for (let index = 1; index < res.data.length; index++) {
    //       if (res.data[index].to > defaultCutOff.to) {
    //         defaultCutOff = res.data[index];
    //       }
    //     }
    //
    //     if (selectedCutOff) {
    //       const filteredCutoff = handleCutoffChange(selectedCutOff?.id);
    //       setSelectedCutOff(filteredCutoff);
    //       reloadTable(filteredCutoff);
    //     } else {
    //       setCutOffs(res.data);
    //       setSelectedCutOff(defaultCutOff);
    //       reloadTable(defaultCutOff);
    //     }
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
    setCutOffDate({
      from: initialCutoff.from,
      to: initialCutoff.to,
    });
    reloadTable(initialCutoff);
  };

  useEffect(() => {
    fetchCutOff();
  }, []);
  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const filteredCutoff = handleCutoffChange(selectedCutOff?.id);

    setCutOffDate(filteredCutoff); // set state for input date
  }, [cutOffs, selectedCutOff]);

  useEffect(() => {
    startAndEndDate();
  }, [selectedCutOff]);

  const pagination = useServerPagination(
    BASE_URL + "/fixedasset/getFixedAsset",
    10
  );

  const reloadTable = (cutOff) => {
    pagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      filterColumn,
      searchText,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/fixedasset/getFixedAsset", {
    //     params: {
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     setInboundData(res.data);
    //     setFilteredData(res.data);
    //     console.log(res.data);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => console.log(err));
  };

  useEffect(() => {
    setInboundData(pagination.data);
    setFilteredData(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    fetchCutOff();
    console.log("fetch");
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  const totalCost = filteredData
    .filter((item) => item.status === "Approved")
    .reduce(
      (total, asset) => total + asset.total_cost * asset.currency_rate,
      0
    );

  const depreciated_amount = filteredData.reduce(
    (total, asset) => total + asset.depreciated_amount * asset.currency_rate,
    0
  );

  const netValue = filteredData
    .filter((item) => item.status === "Approved")
    .reduce((total, asset) => total + asset.net_value * asset.currency_rate, 0);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
  };

  function formatDatetime(datetime) {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(datetime).toLocaleString("en-US", options);
  }

  const columns = [
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_code,
    },
    {
      name: "Date Depreciated",
      selector: (row) => format(row.date_depreciated, "MMM/dd/yyyy"),
    },
    {
      name: "Item Name",
      selector: (row) => row.product_name,
    },
    {
      name: "Total Cost",
      selector: (row) =>
        (row.total_cost || 0)?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          // style: "currency",
          // currency: row.currency_name,
        }),
    },
    {
      name: "Net Value",
      selector: (row) =>
        row.status === "Pending"
          ? "--"
          : (row.net_value || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              // style: "currency",
              // currency: row.currency_name,
            }),
    },
    {
      name: "Months Left",
      selector: (row) =>
        row.status === "Pending"
          ? "--"
          : row.months_left.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
    },
    {
      name: "Remarks",
      selector: (row) => row.remarks || "--",
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
  if (authrztn.includes("FixedAssets-Delete")) {
    columns.push({
      name: "Action",
      selector: (row) => (
        <i
          className="fas fa-trash"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() => handleDeleteFixedAsset(row.id, row.date_depreciated)}
        ></i>
      ),
    });
  }

  const handleDeleteFixedAsset = async (fixedAssetId, fixedAssetDate) => {
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
            `${BASE_URL}/fixedasset/deleteFixedAsset/${fixedAssetId}/${fixedAssetDate}`
          );
          if (response.status === 200) {
            swal({
              title: "Fixed Asset Deleted Successfully!",
              text: "The fixed asset has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              const [filteredCutoff] = cutOffs.filter((item) => {
                return item.id == selectedCutOff?.id;
              });
              reloadTable(filteredCutoff);
            });
          } else if (response.status === 202) {
            const { fixedDate, CutoffName } = response.data;
            swal({
              title: "Delete Prohibited!",
              text: `Fixed asset cannot be deleted as its date (${fixedDate}) falls within the posted cutoff period named "${CutoffName}".`,
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
          if (err.response) {
            swal({
              icon: "error",
              title: "Error",
              text: "An error occurred while deleting the fixed asset.",
            });
          }
        }
      }
    });
  };

  const handleRowClicked = (row) => {
    navigate(`/accounting/fixedAsset/${row.id}`);
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
    reloadTable(cutoff);
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
      ) : authrztn.includes("FixedAssets-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">FIXED ASSETS</span>
            </div>
            <div>
              {authrztn.includes("FixedAssets-Add") && (
                <Link
                  to="/accounting/create-fixed-assets"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              )}
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">
                    <span>
                      <i class="bx bx-bar-chart-alt fs-5 h-100"></i>
                    </span>
                    Total Cost
                  </h5>
                  <p
                    className="card-text text-success amount"
                    title={totalCost.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    style={{ cursor: "default" }}
                  >
                    {totalCost.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      style: "currency",
                      currency: "PHP",
                    })}
                    {/* ₱{totalCost ? compactNumberFormat(totalCost) : "0.00"} */}
                  </p>
                  {/* <p className="card-text">INCREASE 12% VS LAST MONTH</p> */}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title">
                    <span>
                      <i class="bx bx-trending-down me-1 h-100"></i>
                    </span>
                    Depreciated Amount
                  </h5>
                  <p
                    className="card-text text-success amount"
                    title={depreciated_amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    style={{ cursor: "default" }}
                  >
                    {(depreciated_amount || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      style: "currency",
                      currency: "PHP",
                    })}
                    {/* ₱
                    {depreciated_amount
                      ? compactNumberFormat(depreciated_amount)
                      : "0.00"} */}
                  </p>
                  {/* <p className="card-text">INCREASE 12%</p> */}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title d-flex justify-content-center align-items-center">
                    <span>
                      <i class="bx bx-credit-card fs-5 me-1 pt-1"></i>
                    </span>
                    <span>Net Value</span>
                  </h5>
                  <p
                    className="card-text text-success amount"
                    title={netValue.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    style={{ cursor: "default" }}
                  >
                    {(netValue || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      style: "currency",
                      currency: "PHP",
                    })}
                    {/* ₱{netValue ? compactNumberFormat(netValue) : "0.00"} */}
                  </p>
                  {/* <p className="card-text">INCREASE 12%</p> */}
                </div>
              </div>
            </div>
          </div>

          <div className="container-fluid mt-4 p-0">
            <div className="row mx-auto">
              <div className="col-sm mb-2">
                <DateRangePicker
                  startDate={
                    cutOffDate?.from ? new Date(cutOffDate.from) : null
                  }
                  endDate={cutOffDate?.to ? new Date(cutOffDate.to) : null}
                  onDateRangeChange={handleDateRangeChange}
                  label="Date Range"
                />
                {/* <span>Cutoff</span> */}
                {/* <select name="" id="" className="form-select">
                  <option value="" selected disabled>
                    Select Status
                  </option>
                </select> */}
                {/* <select
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
                  <option value="All Cutoff">All</option>
                  {cutOffs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select> */}
              </div>
              {/* <div className="col-sm mb-2">
                <span>From</span>
                <input
                  type="date"
                  className="form-control"
                  value={cutOffDate?.from || ""}
                  readOnly
                  // onChange={(e) => setFromDate(e.target.value)}
                />
                <DatePicker
                  selected={cutOffDate?.from}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <span>To</span>
                <input
                  type="date"
                  className="form-control"
                  value={cutOffDate?.to || ""}
                  readOnly
                  // onChange={(e) => setToDate(e.target.value)}
                />
                <DatePicker
                  selected={cutOffDate?.to}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div> */}
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button
                  className="btn w-100"
                  type="button"
                  onClick={handleFilter}
                >
                  Apply Filter
                </button>
                <button className="btn btn-secondary w-100" type="button">
                  Clear Filter
                </button> */}
              </div>
            </div>
          </div>

          <div className="w-100 mt-4 container-fluid">
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
                      filterColumn === "transaction_code" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("transaction_code")}
                  >
                    Transaction ID
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "date_depreciated" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("date_depreciated")}
                  >
                    Date Depreciated
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "item_name" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("item_name")}
                  >
                    Item Name
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "total_cost" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("total_cost")}
                  >
                    Total Cost
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "remarks" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("remarks")}
                  >
                    Remarks
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

          <div
            className="w-100 mt-3 container-fluid"
            style={{ maxWidth: "79.5vw" }}
          >
            <div className="data-table-cell-width">
              <DataTable
                columns={columns}
                data={filteredData}
                customStyles={customStyles}
                onRowClicked={handleRowClicked}
                className="dataTable"
              />
              <PaginationControls {...pagination} />
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

export default FixedAsset;
