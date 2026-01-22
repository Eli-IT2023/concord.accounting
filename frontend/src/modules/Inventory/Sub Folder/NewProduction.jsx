import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import BASE_URL from "../../../assets/global/url";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../../assets/img/NoAccess.png";
import swal from "sweetalert";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { Tabs, Tab } from "react-bootstrap";
import DateRangePicker from "../../../components/DateRangePicker";
import { getMonthBoundaries, initializeCutoff } from "../../../utils/newdate";

const NewProduction = ({ authrztn }) => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [vendors_db, setVendors_db] = useState([]);
  const [fetchProduction, setFetchProduction] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date

  const [selectedRow, setSelectedRow] = useState([]);
  const [activeKeyTab, setActiveKeyTab] = useState("pending");

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

    setSelectedRow([]);
    setSelectedCutOff(filteredCutoff);
    fetchData(filteredCutoff);
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
    //     fetchData(filteredCutoff);
    //   } else {
    //     setCutOffs(res.data);
    //     setSelectedCutOff(defaultCutOff); // set default cut off
    //     fetchData(defaultCutOff);
    //   }
    // } catch (error) {
    //   console.log(error);
    // }

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    setSelectedCutOff(initialCutoff);
    setCutOffDate(initialCutoff);
    fetchData(initialCutoff);
  };

  useEffect(() => {
    fetchCutoff();
    fetchVendorsData();
  }, []);

  const fetchVendorsData = () => {
    axios
      .get(BASE_URL + "/vendors/fetchVendors")
      .then((res) => {
        setVendors_db(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const pagination = useServerPagination(
    BASE_URL + "/production/getDataProductionNew",
    10
  );

  const fetchData = (cutOff) => {
    pagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      searchText,
      filterColumn,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/production/getDataProduction", {
    //     params: {
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       searchText,
    //       filterColumn,
    //     },
    //   })
    //   .then((res) => {
    //     setFetchProduction(res.data);
    //     console.log(res.data);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchData();
  //     fetchVendorsData();
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, []);

  // useEffect(() => {
  //   if (
  //     searchText &&
  //     searchText.trim() !== "" &&
  //     pagination.currentPage === 1 &&
  //     fetchProduction.length < 10
  //   ) {
  //     pagination.setTotalPages(
  //       Math.ceil(fetchProduction?.length / pagination.itemsPerPage)
  //     );
  //   }
  // }, [fetchProduction]);

  useEffect(() => {
    setFetchProduction(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  useEffect(() => {
    fetchCutoff();
  }, [searchText]);

  console.log(pagination);

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

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
    setFromDate("");
    setToDate("");
  };

  const handleUpdate = (row) => {
    navigate(`/inventory/ProductionsView/${row.id}`);
  };

  const handleIndividualCheckBoxChange = (row) => {
    setSelectedRow((prevSelected) => {
      const isSelected = prevSelected.find(
        (selected) => selected.id === row.id
      );
      if (isSelected) {
        return prevSelected.filter((selected) => selected.id !== row.id);
      } else {
        return [...prevSelected, row];
      }
    });
  };

  const totalProduce = selectedRow.reduce(
    (sum, row) => sum + row.total_produce,
    0
  );
  const totalRawWeight = selectedRow.reduce(
    (sum, row) => sum + row.total_quantity,
    0
  );

  // const totalLoss = selectedRow.reduce((sum, row) => sum + row.percent_loss, 0);

  // const averagePercentLoss = totalLoss / selectedRow.length;

  const weightLoss = totalRawWeight - totalProduce;
  const averagePercentLoss = (weightLoss / totalRawWeight) * 100;

  const columns = [
    {
      name: (
        <input
          type="checkbox"
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRow(fetchProduction);
            } else {
              setSelectedRow([]);
            }
          }}
          checked={
            selectedRow.length === fetchProduction?.length &&
            fetchProduction?.length > 0
          }
        />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedRow.some((selected) => selected.id === row.id)}
          onChange={() => handleIndividualCheckBoxChange(row)}
        />
      ),
    },
    {
      name: "Production ID",
      selector: (row) => (
        <div title={row.production_id}>{row.production_id}</div>
      ),
    },
    {
      name: "Product Description",
      selector: (row) => (row.desc === null ? "n/a" : row.desc),
    },
    {
      name: "Date Produce",
      selector: (row) => format(row.date_produce, "MMM/dd/yyyy"),
    },
    {
      name: "Qty In",
      selector: (row) =>
        row.total_quantity?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || 0,
    },
    {
      name: "Qty Produce",
      selector: (row) =>
        row.total_produce?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || 0,
    },
    {
      name: "Loss (%)",
      selector: (row) => (
        <span style={{ color: "red" }}>
          {row.loss_percent?.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || 0}
          %
        </span>
      ),
    },
    {
      name: "Loss (Qty)",
      selector: (row) => (
        <span style={{ color: "red" }}>
          {row.loss_quantity?.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || 0}
        </span>
      ),
    },
    {
      name: "Status",

      selector: (row) => row.status,
      cell: (row) => {
        let fontColor;

        switch (row.status) {
          case "Pending":
            fontColor = "#FFA500";
            break;
          case "Approved":
            fontColor = "#3B9F3F";
            break;
          case "Rejected":
            fontColor = "#FF0000";
            break;
          default:
            fontColor = "#000000"; // Default color
            break;
        }
        return (
          <div
            style={{
              padding: "5px 10px",
              borderRadius: "5px",
              color: fontColor,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
            className="text-center"
          >
            {" "}
            {row.status}
          </div>
        );
      },
    },
  ];

  if (authrztn.includes("Productions-Delete")) {
    columns.push({
      name: "Action",
      selector: (row) => (
        <i
          className="fas fa-trash"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() => {
            handleDeleteProduction(
              row.id,
              row.date_produce,
              row.production_id,
              row.status,
              row.warehouse_id
            );
          }}
        ></i>
      ),
    });
  }

  const handleSearch = (value) => {
    setSearchText(value);
    pagination.updateApiUrl(
      `${BASE_URL}/production/getDataProductionNew/search`
    );
    pagination.updateParams({
      startDate: cutOffDate?.from,
      endDate: cutOffDate?.to,
      searchText,
      filterColumn,
    });
  };

  const handleDeleteProduction = async (
    primary_id,
    date_produce,
    production_code,
    status,
    warehouseId
  ) => {
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
            `${BASE_URL}/production/deleteProduction/`,
            {
              params: {
                primary_id,
                date_produce,
                production_code,
                status,
                warehouseId,
              },
            }
          );
          if (response.status === 200) {
            swal({
              title: "Production Deleted Successfully!",
              text: "The production has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              fetchCutoff();
            });
          } else if (response.status === 201) {
            swal({
              title: "Delete Prohibited!",
              text: `Production date (${response.data.date_produce}) cannot be deleted as its payable date falls within the posted cutoff period named "${response.data.cutoff_name}".`,
              icon: "warning",
              button: "OK",
            });
          } else if (response.status === 202) {
            const { sales_number } = response.data;

            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the sales in module <strong>${`Sales Invoice`}</strong> with 
                              Transaction Number: <strong>${sales_number}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 203) {
            const { transaction_id } = response.data;

            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the stock transfer in module <strong>${`Stock Transfer`}</strong> with 
                              Transaction Number: <strong>${transaction_id}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
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

  // Filter the production data based on search text and date range
  // const filteredItems = fetchProduction.filter((item) => {
  //   const searchLower = searchText.toLowerCase();

  //   // Check if item falls within the date range
  //   const itemDate = new Date(item?.createdAt);
  //   const fromDateObj = fromDate ? new Date(fromDate) : null;
  //   const toDateObj = toDate ? new Date(toDate) : null;

  //   // Function to remove time component from date
  //   const normalizeDate = (date) =>
  //     new Date(date.getFullYear(), date.getMonth(), date.getDate());

  //   const normalizedItemDate = normalizeDate(itemDate);
  //   const normalizedFromDate = fromDateObj ? normalizeDate(fromDateObj) : null;
  //   const normalizedToDate = toDateObj ? normalizeDate(toDateObj) : null;

  //   // If there are valid "From" and "To" dates, filter by date range
  //   if (normalizedFromDate && normalizedItemDate < normalizedFromDate)
  //     return false;
  //   if (normalizedToDate && normalizedItemDate > normalizedToDate) return false;

  //   // Search text filter
  //   if (searchText) {
  //     switch (filterColumn) {
  //       case "production_id":
  //         return item?.production_id
  //           ?.toString()
  //           .toLowerCase()
  //           .includes(searchLower);
  //       case "desc":
  //         return item?.desc === null
  //           ? "n/a".includes(searchLower)
  //           : item?.desc.toLowerCase().includes(searchLower);
  //       case "date_created":
  //         const formattedDate = formatDatetime(item?.createdAt).toLowerCase();
  //         return formattedDate.includes(searchLower);
  //       default:
  //         return (
  //           item?.production_id
  //             ?.toString()
  //             .toLowerCase()
  //             .includes(searchLower) ||
  //           (item?.desc === null
  //             ? "n/a".includes(searchLower)
  //             : item?.desc.toLowerCase().includes(searchLower)) ||
  //           formatDatetime(item?.createdAt).toLowerCase().includes(searchLower)
  //         );
  //     }
  //   }

  //   return true;
  // });

  // Add a function to determine status
  const getStatus = (row) => {
    return row.status ? row.status.toLowerCase() : "pending";
  };

  // Filter fetchProduction based on active tab
  const filteredByStatus = fetchProduction?.filter((row) => {
    if (activeKeyTab === "all") return true;
    return getStatus(row) === activeKeyTab;
  });

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
    setSelectedRow([]);
    fetchData(cutoff);
  };

  return (
    <div className="h-100 w-100 bg-white">
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
      ) : authrztn.includes("Productions-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">PRODUCTION</span>
            </div>
            <div>
              {authrztn.includes("Productions-Add") && (
                <Link
                  to="/inventory/productions-form"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              )}
            </div>
          </div>

          {selectedRow.length >= 1 ? (
            <>
              <div className="row p-2 mx-auto">
                <div className="col-sm w-100 p-3 payable-card">
                  <div className="w-100 border p-3 shadow-sm rounded h-100">
                    <div className=" d-flex flex-row align-items-center payable-icon">
                      <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                      <h3>Total Raw Materials</h3>
                    </div>

                    <div className=" mt-2 d-flex flex-column payable-card-desc">
                      <h1 className="produce-amount">
                        {totalRawWeight.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </h1>
                      {/* <span className="text-secondary ">
                      Number of Transaction: <strong>12</strong>
                    </span> */}
                    </div>
                  </div>
                </div>
                <div className="col-sm w-100 p-3 payable-card">
                  <div className="w-100 border p-3 shadow-sm rounded h-100">
                    <div className=" d-flex flex-row align-items-center payable-icon">
                      <i class="bx bx-wallet fs-3 h-100"></i>
                      <h3>Total Produce</h3>
                    </div>

                    <div className=" mt-2">
                      <h1 className="produce-amount">
                        {totalProduce.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </h1>
                    </div>
                  </div>
                </div>
                <div className="col-sm w-100 p-3 payable-card">
                  <div className="w-100 border p-3 shadow-sm rounded h-100">
                    <div className=" d-flex flex-row align-items-center payable-icon">
                      <i class="bx bx-trending-down fs-3 h-100"></i>
                      <h3>Average Loss</h3>
                    </div>

                    <div className=" mt-2">
                      <h1 className="produce-amount text-danger">
                        {averagePercentLoss.toFixed(2)}%
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          <div className="container-fluid mt-4">
            <div className="row">
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
              <div className="col-sm d-flex flex-row align-items-end  filter-btn-container w-100">
                {/* <button className="btn w-100" onClick={fetchData}>
              Apply Filter
            </button> */}
                {/* <button
                  className="btn btn-secondary w-100"
                  onClick={clearFilter}
                >
                  Clear Filter
                </button> */}
              </div>
            </div>
            <div className="col-sm mt-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
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
                        filterColumn === "all" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("all")}
                    >
                      All
                    </button>
                  </li>
                  {[
                    { value: "production_id", label: "Product ID" },
                    { value: "desc", label: "Product Description" },
                    { value: "date_produce", label: "Date Produce" },
                    { value: "total_quantity", label: "Qty In" },
                    { value: "total_produce", label: "Qty Produce" },
                    { value: "loss_percent", label: "Loss (%)" },
                    { value: "loss_quantity", label: "Loss (Qty)" },
                    { value: "status", label: "Status" },
                  ].map(({ value, label }) => (
                    <li key={value}>
                      <button
                        className={`dropdown-item ${
                          filterColumn === value ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn(value)}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="w-100 mt-3 container-fluid">
            <Tabs
              id="production-status-tabs"
              activeKey={activeKeyTab}
              onSelect={(k) => setActiveKeyTab(k)}
              className="mb-3"
            >
              <Tab eventKey="pending" title="Pending" />
              <Tab eventKey="approved" title="Approved" />
              <Tab eventKey="rejected" title="Rejected" />
              <Tab eventKey="all" title="All" />
            </Tabs>
            <DataTable
              columns={columns}
              data={filteredByStatus}
              customStyles={customStyles}
              className="dataTable"
              onRowClicked={handleUpdate}
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

export default NewProduction;
