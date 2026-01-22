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
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";

const InventoryCounting = ({ authrztn }) => {
  const navigate = useNavigate();

  const [inboundData, setInboundData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date

  // handle change select cutoff date
  const handleSelect = (e) => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id == e.target.value;
    });

    setSelectedCutOff(filteredCutoff);
    reloadTable(filteredCutoff);
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

  const fetchCutoff = async () => {
    try {
      const res = await axios.get(BASE_URL + "/outstanding/getCutoffs");
      let defaultCutOff = res.data[0];
      // get the latest date for default cut off
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
        reloadTable(filteredCutoff);
      } else {
        setCutOffs(res.data);
        setSelectedCutOff(defaultCutOff); // set default cut off
        reloadTable(defaultCutOff);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const pagination = useServerPagination(
    BASE_URL + "/inventoryCounting/getInventoryCounting",
    10
  );

  const reloadTable = (cutOff) => {
    pagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      searchText,
      filterColumn,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/inventoryCounting/getInventoryCounting", {
    //     params: {
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       searchText,
    //       filterColumn,
    //     },
    //   })
    //   .then((res) => {
    //     setInboundData(res.data);
    //     setFilteredData(res.data); // Initialize filtered data
    //     setIsLoading(false);
    //   })
    //   .catch((err) => console.log(err));
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     reloadTable();
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, []);

  useEffect(() => {
    setInboundData(pagination.data);
    setFilteredData(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    fetchCutoff();
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  // Search functionality
  const handleSearch = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);

    const filtered = inboundData.filter(
      (item) =>
        item.remarks?.toLowerCase().includes(text) ||
        item.inventory_counting_id.toString().includes(text) ||
        item.user?.toLowerCase().includes(text) ||
        item.status?.toLowerCase().includes(text)
    );
    setFilteredData(filtered);
  };

  // Date range filter
  const handleDateFilter = () => {
    const filtered = inboundData.filter((item) => {
      const countingDate = new Date(item.counting_date);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      if (from && to) {
        return countingDate >= from && countingDate <= to;
      } else if (from) {
        return countingDate >= from;
      } else if (to) {
        return countingDate <= to;
      }
      return true;
    });
    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setSearchText("");
    setFilteredData(inboundData);
  };

  const columns = [
    {
      name: "Remarks",
      selector: (row) => row.remarks,
    },
    // {
    //   name: "Counting ID",
    //   selector: (row) => row.inventoryCountingId,
    // },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let color;
        switch (row.status) {
          case "For Approval":
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
      name: "Counting Time",
      selector: (row) => format(row.countingDate, "MMM dd, yyyy"),
    },
    {
      name: "User",
      selector: (row) => row.user,
    },
  ];

  const userData = inboundData?.map((data, i) => {
    const countingDate = new Date(data.counting_date);
    const formattedDate = countingDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return {
      key: i,
      inventoryCountingId: data.inventory_counting_id,
      countingDate: data.counting_date,
      remarks: data.remarks,
      status: data.status,
      user: data.user,
    };
  });

  const handleUpdateModalToggle = (row) => {
    navigate(`/inventory/inventory-counting-update/${row.inventoryCountingId}`);
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
      ) : authrztn.includes("InventoryCounting-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">INVENTORY COUNTING</span>
              <span>STOCK COUNTING</span>
            </div>
            {authrztn.includes("InventoryCounting-Add") && (
              <div>
                <Link
                  to="/inventory/inventory-counting-create"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              </div>
            )}
          </div>
          <div className="container-fluid mt-4">
            <div className="row">
              <div className="col-sm">
                <label htmlFor="cutoff">Cutoff</label>
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select"
                  id="cutoff"
                  aria-label="Default select example"
                >
                  {cutOffs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm">
                <label htmlFor="cutoff-start-date">From</label>
                {/* <input
                  type="date"
                  value={cutOffDate?.from || ""}
                  readOnly
                  name="cutoff-start-date"
                  id="cutoff-start-date"
                  className="form-control"
                /> */}
                <DatePicker
                  selected={cutOffDate?.from}
                  dateFormat="MMM dd, yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm">
                <label htmlFor="cutoff-end-date">To</label>
                {/* <input
                  type="date"
                  value={cutOffDate?.to || ""}
                  readOnly
                  name="cutoff-end-date"
                  id="cutoff-end-date"
                  className="form-control"
                /> */}
                <DatePicker
                  selected={cutOffDate?.to}
                  dateFormat="MMM dd, yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm"></div>
              {/* <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                <button className="btn w-100" onClick={handleDateFilter}>
                  Apply Filter
                </button>
                <button
                  className="btn btn-secondary w-100"
                  onClick={clearFilters}
                >
                  Clear Filter
                </button>
              </div> */}
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
                {[
                  { value: "remarks", label: "Remarks" },
                  { value: "inventory_counting_id", label: "Counting ID" },
                  { value: "status", label: "Status" },
                  { value: "counting_date", label: "Counting Time" },
                  { value: "user", label: "User" },
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
          {/* data table */}
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              data={userData}
              customStyles={customStyles}
              className="dataTable"
              onRowClicked={handleUpdateModalToggle}
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

export default InventoryCounting;
