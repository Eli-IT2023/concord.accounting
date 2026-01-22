import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import "../../assets/css/style.css";
import { customStyles } from "../styles/table-style";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import maskCurrency from "../../utils/maskCurrency";

const FixedAsset = ({ authrztn, roleType }) => {
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

  const reloadTable = () => {
    axios
      .get(BASE_URL + "/fixedasset/getFixedAsset", {
        params: {
          filterColumn,
          searchText,
        },
      })
      .then((res) => {
        setInboundData(res.data);
        setFilteredData(res.data);
        console.log(res.data);
        setIsLoading(false);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    reloadTable();
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  const totalCost = filteredData.reduce(
    (total, asset) => total + asset.total_cost * asset.currency_rate,
    0
  );

  const depreciated_amount = filteredData.reduce(
    (total, asset) => total + asset.depreciated_amount * asset.currency_rate,
    0
  );

  const netValue = filteredData.reduce(
    (total, asset) => total + asset.net_value * asset.currency_rate,
    0
  );

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
      selector: (row) => format(row.date_depreciated, "MMM dd, yyyy"),
    },
    {
      name: "Item Name",
      selector: (row) => row.product_name,
    },
    {
      name: "Total Cost",
      selector: (row) =>
        row.total_cost.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          style: "currency",
          currency: row.currency_name,
        }),
    },
    {
      name: "Net Value",
      selector: (row) =>
        row.status === "Pending"
          ? "--"
          : row.net_value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              style: "currency",
              currency: row.currency_name,
            }),
    },
    {
      name: "Months Left",
      selector: (row) => (row.status === "Pending" ? "--" : row.months_left),
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
              reloadTable();
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
                  <p className="card-text text-success amount">
                    {roleType?.includes("Management") ? (
                      totalCost.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        style: "currency",
                        currency: "PHP",
                      })
                    ) : (
                      <span
                        className="masked-value"
                        style={{ fontSize: "2rem", fontWeight: "bold" }}
                      >
                        {maskCurrency(100)}
                      </span>
                    )}
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
                  <p className="card-text text-success amount">
                    {roleType?.includes("Management") ? (
                      depreciated_amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    ) : (
                      <span
                        className="masked-value"
                        style={{ fontSize: "2rem", fontWeight: "bold" }}
                      >
                        {maskCurrency(100)}
                      </span>
                    )}
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
                  <p className="card-text text-success amount">
                    {roleType?.includes("Management") ? (
                      netValue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        style: "currency",
                        currency: "PHP",
                      })
                    ) : (
                      <span
                        className="masked-value"
                        style={{ fontSize: "2rem", fontWeight: "bold" }}
                      >
                        {maskCurrency(100)}
                      </span>
                    )}
                  </p>
                  {/* <p className="card-text">INCREASE 12%</p> */}
                </div>
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
                <li
                  className={roleType?.includes("Management") ? "" : "d-none"}
                >
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

          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              pagination
              data={filteredData}
              customStyles={customStyles}
              onRowClicked={handleRowClicked}
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

export default FixedAsset;
