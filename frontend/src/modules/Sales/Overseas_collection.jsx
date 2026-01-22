import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { Link } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import { useNavigate } from "react-router-dom";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";

const Overseas_collection = ({ authrztn, roleType }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [overseasCollectionData, setOverseasCollectionData] = useState([]);
  const [totalCollection, setTotalCollection] = useState(0);
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date
  const maskCurrency = (value) => {
    return Number(value)
      .toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      .replace(/[0-9]/g, "*");
  };
  // handle change select cutoff date
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

    setCutOffDate(filteredCutoff); // set state for input date
  }, [cutOffs, selectedCutOff]);

  useEffect(() => {
    startAndEndDate();
  }, [selectedCutOff]);

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
        if (selectedCutOff) {
          const [filteredCutoff] = cutOffs.filter((item) => {
            return item.id == selectedCutOff?.id;
          });
          setSelectedCutOff(filteredCutoff); // set default cut off
          fetchSalesInvoiceData(filteredCutoff);
        } else {
          setCutOffs(res.data); // store all cut off
          setSelectedCutOff(defaultCutOff); // set default cut off
          fetchSalesInvoiceData(defaultCutOff);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const pagination = useServerPagination(
    BASE_URL + "/overseas_bulkcollection/getOverseasCollectionData",
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
    //   .get(BASE_URL + "/overseas_bulkcollection/getOverseasCollectionData", {
    //     params: {
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       filterColumn,
    //       searchTerm,
    //     },
    //   })
    //   .then((res) => {
    //     const { collectionDataWithBalance, totalCollection } = res.data;
    //     setOverseasCollectionData(collectionDataWithBalance);
    //     console.log(collectionDataWithBalance);
    //     setTotalCollection(totalCollection);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     setIsLoading(true);
    //   });
  };

  // const handleSearch = (query, column = "") => {
  //   setSearchTerm(query);
  //   if (query.trim() === "") {
  //     fetchSalesInvoiceData(selectedCutOff);
  //     return;
  //   }
  //   axios
  //     .get(`${BASE_URL}/overseas_bulkcollection/searchSalesData`, {
  //       params: {
  //         query,
  //         filterColumn: column || filterColumn,
  //       },
  //     })
  //     .then((res) => {
  //       setOverseasCollectionData(res.data);
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

  const columns = [
    {
      name: "Transaction No.",
      selector: (row) => row.transaction_number,
    },
    {
      name: "Transaction Date",
      selector: (row) => format(row.collection_date, "MMM dd, yyyy"),
    },
    {
      name: "Destination",
      selector: (row) =>
        row.bulk_collection_transactions[0]?.sales_invoice?.destination ||
        "N/A",
    },
    {
      name: "Discount",
      selector: (row) =>
        (
          row.bulk_collection_transactions[0]?.sales_invoice
            ?.transaction_discount +
          row.bulk_collection_transactions[0]?.sales_invoice.item_discount
        ).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Balance",
      selector: (row) =>
        row.balance.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0.00",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let textColor = "";
        let fontWeight = "bold";
        let displayStatus = row.status; // Default to the original status

        switch (row.status) {
          case "For Approval":
            textColor = "orange";
            break;
          case "Approved":
            textColor = "green";
            break;
          case "Rejected":
            textColor = "red";
            break;
          case "Claimed":
            textColor = "green";
            displayStatus = "Collected"; // Change display text
            break;
          default:
            textColor = "black";
        }

        return (
          <div
            style={{
              color: textColor,
              fontWeight: fontWeight,
              padding: "5px",
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            {displayStatus}
          </div>
        );
      },
    },
  ];
  if (authrztn.includes("OverseasCollections-Delete")) {
    columns.push({
      name: "ACTION",
      selector: (row) => (
        <i
          className="fas fa-trash"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() =>
            handleDeleteOverseasCollection(
              row.id,
              row.collection_date,
              row.transaction_number
            )
          }
        ></i>
      ),
    });
  }

  const handleDeleteOverseasCollection = async (
    overseasBulkId,
    overseasDate,
    transaction_id
  ) => {
    console.log(transaction_id);
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
            `${BASE_URL}/overseas_bulkcollection/deleteOverseasCollection/${overseasBulkId}/${overseasDate}`,
            {
              data: { userLoggedID, transaction_id },
            }
          );
          if (response.status === 200) {
            swal({
              title: "Overseas Collection Deleted Successfully!",
              text: "The overseas collection has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              fetchSalesInvoiceData();
              fetchCutOff();
            });
          } else if (response.status === 202) {
            const { issuedDate, CutoffName } = response.data;
            swal({
              title: "Delete Prohibited!",
              text: `Overseas collection cannot be deleted as its issued date (${issuedDate}) falls within the posted cutoff period "${CutoffName}".`,
              icon: "warning",
              button: "OK",
            });
          } else if (response.status === 203) {
            const { transactionNumber } = response.data;
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first all the data in module <strong>Collection Check</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
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
            text: "An error occurred while deleting the overseas collection.",
          });
        }
      }
    });
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchCutOff();
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, []);
  useEffect(() => {
    fetchCutOff();
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  useEffect(() => {
    const { collectionDataWithBalance, totalCollection } = pagination.data;
    setOverseasCollectionData(collectionDataWithBalance);
    setTotalCollection(totalCollection);
  }, [pagination.data]);

  useEffect(() => {
    if (
      searchTerm &&
      searchTerm.trim() !== "" &&
      pagination.currentPage === 1 &&
      overseasCollectionData.length < 10
    ) {
      pagination.setTotalPages(
        Math.ceil(overseasCollectionData?.length / pagination.itemsPerPage)
      );
    }
  }, [overseasCollectionData]);

  const viewOverseasCollections = (row) => {
    navigate(`/sales/view-overseas-bulk-collection/${row.id}`);
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
      ) : authrztn.includes("OverseasCollections-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">RECEIVABLE</span>
              <span>OVERSEAS ACCOUNTS RECEIVABLE</span>
            </div>
            <div>
              {authrztn.includes("OverseasCollections-Add") && (
                <Link
                  to="/sales/overseas-bulk-collection"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Bulk Receivable
                </Link>
              )}
            </div>
          </div>

          <div className="container-fluid mt-4 p-0">
            <div
              className="container"
              style={{ paddingRight: "400px", paddingLeft: "400px" }}
            >
              <div className="row mx-auto">
                <div className="col-sm w-100 p-3 payable-card">
                  <div className="w-100 border p-3 shadow-sm rounded h-100">
                    <div className=" d-flex flex-row align-items-center payable-icon">
                      <i class="bx bx-money-withdraw fs-3 h-100"></i>
                      <h3>Total Collection</h3>
                    </div>

                    <div className=" mt-2 d-flex flex-column payable-card-desc">
                      <p
                        className="payable-amount"
                        style={{ color: "green", fontSize: "2.5rem" }}
                      >
                        {roleType?.includes("Management") ? (
                          totalCollection !== undefined &&
                          totalCollection !== null ? (
                            totalCollection.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          ) : (
                            "0.00"
                          )
                        ) : (
                          <span
                            className="masked-value"
                            style={{ color: "green", fontSize: "2.5rem" }}
                          >
                            {maskCurrency(
                              totalCollection !== undefined &&
                                totalCollection !== null
                                ? totalCollection
                                : 0
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row mx-auto mt-2">
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
                  value={cutOffDate?.to || ""}
                  readOnly
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
          </div>

          <div className="w-100 mt-2 mb-2 container-fluid">
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
                  { value: "transaction_number", label: "Transaction No." },
                  { value: "transaction_date", label: "Transaction Date" },
                  // { value: "destination", label: "Destination" },
                  { value: "discount", label: "Discount" },
                  { value: "balance", label: "Balance" },
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
              data={overseasCollectionData}
              customStyles={customStyles}
              className="dataTable"
              onRowClicked={viewOverseasCollections}
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

export default Overseas_collection;
