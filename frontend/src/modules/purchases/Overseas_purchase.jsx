import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { useValidPage } from "../../hooks/customHook/paginationHook/useValidPage";
import { compactNumberFormat } from "../../utils/numberFormatter";
import CurrencySelector from "../../components/CurrencySelector";

const Overseas_purchase = ({ authrztn }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const overseasPayableTotalPages = localStorage.getItem("Overseas-Payable");
  const validPage = useValidPage(overseasPayableTotalPages);
  const [isLoading, setIsLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [payable, setPayable] = useState([]);
  const [totalPayable, setTotalPayable] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date
  const [searchParams, setSearchParams] = useSearchParams();
  const [deletionTrigger, setDeletionTrigger] = useState(false);
  const [currencyId, setCurrencyId] = useState(
    "11111111-1111-1111-1111-111111111111"
  );

  const [widgetCurrencySymbol, setWidgetCurrencySymbol] = useState("");

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
    const params = new URLSearchParams(searchParams);
    params.set("page", 1);
    setSearchParams(params);
    pagination.setCurrentPage(1);
    setSearchText("");

    setSelectedCutOff(filteredCutoff);
    fetchData(filteredCutoff);
    fetchTotalPayable(filteredCutoff);
    fetchTotalPaid(filteredCutoff);
  };

  const fetchCutOff = () => {
    axios
      .get(BASE_URL + "/cutoff/getCutoffs")
      .then((res) => {
        let defaultCutOff = res.data[0];
        // get the latest date for default cut off
        for (let index = 1; index < res.data.length; index++) {
          if (res.data[index].to > defaultCutOff.to) {
            defaultCutOff = res.data[index];
          }
        }
        if (selectedCutOff) {
          const filteredCutoff = handleCutoffChange(selectedCutOff?.id);

          setSelectedCutOff(filteredCutoff); // set default cut off
          fetchData(filteredCutoff);
          fetchTotalPayable(filteredCutoff);
          fetchTotalPaid(filteredCutoff);
        } else {
          setCutOffs(res.data); // store all cut off
          setSelectedCutOff(defaultCutOff); // set default cut off
          fetchData(defaultCutOff);
          fetchTotalPayable(defaultCutOff);
          fetchTotalPaid(defaultCutOff);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const filteredCutoff = handleCutoffChange(selectedCutOff?.id);

    setCutOffDate(filteredCutoff); // set state for input date
  }, [cutOffs, selectedCutOff]);

  useEffect(() => {
    startAndEndDate();
  }, [selectedCutOff]);
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
  // const columns = [
  //   {
  //     name: "Transaction No.",
  //     selector: (row) => row.transaction_id,
  //   },
  //   {
  //     name: "Tracking Number",
  //     selector: (row) =>
  //       row.tracking_number === null ? "--" : row.tracking_number,
  //   },
  //   {
  //     name: "Receiving Warehouse",
  //     selector: (row) => row.warehouse.name,
  //   },
  //   {
  //     name: "Date Created",
  //     selector: (row) => formatDatetime(row.createdAt),
  //   },
  //   {
  //     name: "Mode of Payment",
  //     selector: (row) => (row.MOP === null ? "No Payment Chosen" : row.MOP),
  //   },
  //   {
  //     name: "Vendor",
  //     selector: (row) => row.vendor.company_name,
  //   },
  //   {
  //     name: "Due Date",
  //     selector: (row) => row.due_date,
  //   },
  //   {
  //     name: "Total Amount",
  //     cell: (row) => {
  //       let totalPrice = 0;
  //       row.payable_products.forEach((data) => {
  //         totalPrice += data.product_tag_vendor.product_price * data.weight;
  //       });

  //       const moisture = row.payable_products.reduce((acc, data) => {
  //         if (data.moisture_type === "%") {
  //           return (
  //             acc +
  //             parseFloat(
  //               (data.moisture / 100) *
  //                 data.product_tag_vendor.product_price *
  //                 data.weight || 0
  //             )
  //           );
  //         } else {
  //           return acc + parseFloat(data.moisture || 0);
  //         }
  //       }, 0);

  //       const totalOtherFees = row.payable_other_fees.reduce(
  //         (acc, data) => acc + parseFloat(data.fee_amount || 0),
  //         0
  //       );

  //       const calculateDiscount =
  //         row.isPercent_Discount === true
  //           ? (row.discount_value / 100) *
  //             parseFloat(
  //               totalPrice - moisture - row.weighing_fee - totalOtherFees
  //             )
  //           : row.discount_value;

  //       return (
  //         <span>
  //           {totalPrice -
  //             moisture -
  //             row.weighing_fee -
  //             totalOtherFees -
  //             calculateDiscount}
  //         </span>
  //       );
  //     },
  //   },
  //   {
  //     name: "Status",
  //     selector: (row) => (
  //       <span
  //         style={{
  //           color: row.status === "Active" ? "green" : "red",
  //           border: `1px solid ${row.status === "Active" ? "green" : "red"}`,
  //           padding: "2px 15px",
  //           borderRadius: "12px",
  //           display: "inline-block",
  //         }}
  //       >
  //         {row.status}
  //       </span>
  //     ),
  //   },
  //   {
  //     name: "Action",
  //     selector: (row) => (
  //       <button
  //         className="btn btn-primary"
  //         style={{
  //           border: "none",
  //           borderRadius: "5px",
  //           padding: "0.2rem 1.3rem",
  //           cursor: "pointer",
  //           fontSize: "13px",
  //         }}
  //         onClick={() => navigate(`../Purchases/purchase-pay/${row.id}`)}
  //       >
  //         Pay
  //       </button>
  //     ),
  //   },
  // ];

  const formatDate = (dateTime) => {
    const newDate = new Date(dateTime);
    const month = (newDate.getMonth() + 1).toString().padStart(2, "0");
    const day = newDate.getDate().toString().padStart(2, "0");
    const year = newDate.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const handleSearch = (e) => {
    let input = e.target.value;

    // Remove commas
    const raw = String(input).replace(/,/g, "");

    const [intPart, decimalPart] = raw.split(".");

    // Add commas to integer part
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Join back decimal part if it exists
    const formatted =
      decimalPart !== undefined ? `${withCommas}.${decimalPart}` : withCommas;

    if (
      payable.find((item) => {
        const totalAmount = item.total_amount;
        return (
          Number(totalAmount.toPrecision(17)).toString().includes(raw) ||
          totalAmount.toFixed(17).includes(raw)
        );
      })
    ) {
      setSearchText(formatted);
    } else {
      setSearchText(raw);
    }
  };

  const columns = [
    {
      name: "Transaction No.",
      selector: (row) => row.transaction_number,
    },
    {
      name: "Vendor",
      selector: (row) => row.vendor.company_name,
    },
    {
      name: "Date Created",
      selector: (row) => format(row.createdAt, "MMM/dd/yyyy, hh:mm a"),
    },
    {
      name: "Transaction Date",
      selector: (row) => format(row.payable_date, "MMM/dd/yyyy"),
    },
    {
      name: "Exchange Rate Used",
      selector: (row) => row?.currency?.currency_rate,
    },
    {
      name: "Total Amount",
      selector: (row) =>
        `${row?.currency?.currency_name} 
      ${row.total_amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    // {
    //   name: "Total Amount",
    //   cell: (row) => {
    //     let totalPrice = 0;
    //     row.payable_products.forEach((data) => {
    //       totalPrice += data.product_tag_vendor.product_price * data.weight;
    //     });

    //     const moisture = row.payable_products.reduce((acc, data) => {
    //       if (data.moisture_type === "%") {
    //         return (
    //           acc +
    //           parseFloat(
    //             (data.moisture / 100) *
    //               data.product_tag_vendor.product_price *
    //               data.weight || 0
    //           )
    //         );
    //       } else {
    //         return acc + parseFloat(data.moisture || 0);
    //       }
    //     }, 0);

    //     const totalOtherFees = row.payable_other_fees.reduce(
    //       (acc, data) => acc + parseFloat(data.fee_amount || 0),
    //       0
    //     );

    //     const calculateDiscount =
    //       row.isPercent_Discount === true
    //         ? (row.discount_value / 100) *
    //           parseFloat(
    //             totalPrice - moisture - row.weighing_fee - totalOtherFees
    //           )
    //         : row.discount_value;

    //     return (
    //       <span>
    //         {totalPrice -
    //           moisture -
    //           row.weighing_fee -
    //           totalOtherFees -
    //           calculateDiscount}
    //       </span>
    //     );
    //   },
    // },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let fontColor;

        switch (row.status) {
          case "For-Approval":
            fontColor = "#FFA500";
            break;
          case "Approved":
            fontColor = "#3B9F3F";
            break;
          case "Rejected":
            fontColor = "#FF0000";
            break;
          default:
            fontColor = "black";
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
          >
            {" "}
            {row.status}
          </div>
        );
      },
    },
    // {
    //   name: "Action",
    //   selector: (row) => (
    //     <button
    //       className="btn btn-primary"
    //       style={{
    //         border: "none",
    //         borderRadius: "5px",
    //         padding: "0.2rem 1.3rem",
    //         cursor: "pointer",
    //         fontSize: "13px",
    //       }}
    //       onClick={() => navigate(`../Purchases/purchase-pay/${row.id}`)}
    //     >
    //       Pay
    //     </button>
    //   ),
    // },
  ];

  if (authrztn.includes("LocalPurchase-Delete")) {
    columns.push({
      name: "Action",
      selector: (row) => (
        <i
          className="fas fa-trash"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() =>
            handleDeletePayable(
              row.id,
              row.payable_date,
              row.transaction_number
            )
          }
        ></i>
      ),
    });
  }

  const handleDeletePayable = async (
    primary_id,
    purchase_date,
    transaction_id
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
            `${BASE_URL}/payable/localOverseasdeletePayable/`,
            {
              params: {
                primary_id,
                purchase_date,
                transaction_id,
                userLoggedID,
              },
            }
          );
          if (response.status === 200) {
            swal({
              title: "Purchase Payment Deleted Successfully!",
              text: "The purchase payment has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              fetchCutOff();
              setDeletionTrigger(true);
            });
          } else if (response.status === 201) {
            swal({
              title: "Delete Prohibited!",
              text: `Date (${response.data.purchase_date}) cannot be deleted as its payable date falls within the posted cutoff period named "${response.data.cutoff_name}".`,
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

  const handleRowClick = (data) => {
    navigate(
      `/Purchases/view-bulk-payable/overseas/${data.id}?page=${pagination.currentPage}`
    );
  };

  const pagination = useServerPagination(
    BASE_URL + "/payable/fetch_overseas_payable_bulk",
    10,
    {},
    validPage
  );

  const fetchData = (cutOff) => {
    pagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      filterColumn,
      searchText,
      currencyId,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/payable/fetch_overseas_payable_bulk", {
    //     params: {
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     setPayable(res.data);
    //     console.log(res.data);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     setIsLoading(true);
    //   });
  };

  const fetchTotalPayable = async (cutOff) => {
    try {
      const res = await axios.get(`${BASE_URL}/payable/fetchTotalPayable`, {
        params: {
          domestic_type: "overseas",
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      });
      setTotalPayable(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTotalPaid = async (cutOff) => {
    try {
      const res = await axios.get(`${BASE_URL}/payable/fetchTotalPaid`, {
        params: {
          domestic_type: "overseas",
          startDate: cutOff?.from,
          endDate: cutOff?.to,
          currencyId,
        },
      });
      setTotalPaid(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchCutOff();
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, 1500);

  //   return () => clearTimeout(timer);
  // }, []);

  useEffect(() => {
    setPayable(pagination.data);

    const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
    const currentPage = isNaN(pageFromUrl) ? 1 : pageFromUrl;
    const safePage = Math.max(1, Math.min(currentPage, pagination.totalPages));

    if (pagination.data.length > 0) {
      localStorage.setItem("Overseas-Payable", pagination.totalPages);
    }

    if (deletionTrigger && pagination.data.length === 0 && currentPage > 1) {
      pagination.setCurrentPage(currentPage - 1);
    }

    if (safePage != pagination.currentPage) {
      const params = new URLSearchParams(searchParams);
      params.set("page", pagination.currentPage);
      setSearchParams(params);
      return;
    }

    pagination.setCurrentPage(safePage);
  }, [pagination.data, pagination.totalPages, searchParams]);

  useEffect(() => {
    fetchCutOff();
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  //   filter
  // search
  // const filteredItems = payable.filter((item) => {
  //   if (!searchText) return true;

  //   const searchLower = searchText.toLowerCase();

  //   switch (filterColumn) {
  //     case "transaction_no":
  //       return item.transaction_id?.toLowerCase().includes(searchLower);
  //     case "tracking_no":
  //       return item.tracking_number?.toLowerCase().includes(searchLower);
  //     case "receiving_warehouse":
  //       return item.warehouse?.name?.toLowerCase().includes(searchLower);
  //     case "date_created":
  //       return formatDatetime(item.createdAt)
  //         ?.toLowerCase()
  //         .includes(searchLower);
  //     case "payment_method":
  //       return item.MOP?.toLowerCase().includes(searchLower);
  //     case "vendor_id":
  //       return item.vendor?.company_name?.toLowerCase().includes(searchLower);
  //     case "due_date":
  //       return item.due_date?.toLowerCase().includes(searchLower);
  //     // case "amount":
  //     //   return item.amount?.toLowerCase().includes(searchLower);
  //     case "status":
  //       return item.status?.toLowerCase().includes(searchLower);
  //     default:
  //       return (
  //         item.transaction_id?.toLowerCase().includes(searchLower) ||
  //         item.warehouse?.name?.toLowerCase().includes(searchLower) ||
  //         item.createdAt?.toLowerCase().includes(searchLower) ||
  //         item.MOP?.toLowerCase().includes(searchLower) ||
  //         item.vendor?.company_name?.toLowerCase().includes(searchLower) ||
  //         item.due_date?.toLowerCase().includes(searchLower) ||
  //         // item.amount?.toLowerCase().includes(searchLower) ||
  //         item.status?.toLowerCase().includes(searchLower)
  //       );
  //   }
  // });
  const filteredItems = payable?.filter((item) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();

    switch (filterColumn) {
      case "transaction_no":
        return item.transaction_number?.includes(searchLower);
      case "date_created":
        return formatDatetime(item.createdAt)
          ?.toLowerCase()
          .includes(searchLower);
      case "status":
        return item.status?.toLowerCase().includes(searchLower);
      default:
        return (
          item.transaction_number?.includes(searchLower) ||
          item.createdAt?.toLowerCase().includes(searchLower) ||
          item.status?.toLowerCase().includes(searchLower) ||
          item.payable_date?.includes(searchLower)
        );
    }
  });

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
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
      ) : authrztn.includes("OverseasPurchase-View") ? (
        <>
          <div className="w-100 px-2 pt-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Overseas Purchase</span>
              <span>OVERSEAS ACCOUNTS PAYABLE</span>
            </div>
            <div>
              {authrztn.includes("OverseasPurchase-Add") && (
                <Link
                  to={`/Purchases/bulk-payable/${"overseas"}`}
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Pay
                </Link>
              )}
            </div>
          </div>
          <CurrencySelector
            setWidgetCurrencySymbol={setWidgetCurrencySymbol}
            fetchCutOff={fetchCutOff}
            currencyId={currencyId}
            setCurrencyId={setCurrencyId}
            setCurrentPage={pagination.setCurrentPage}
            style={{ maxWidth: "7rem" }}
          />
          <div className="container-fluid p-0">
            <div className="row p-2 mx-auto">
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                    <h3>Total Payable</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <h1
                      // className="payable-amount"
                      title={totalPayable?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      style={{ cursor: "pointer", color: "rgb(40, 209, 40)" }}
                    >
                      {widgetCurrencySymbol}{" "}
                      {totalPayable?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                      {/* {widgetCurrencySymbol}{" "}
                      {totalPayable
                        ? compactNumberFormat(totalPayable)
                        : "0.00"} */}
                    </h1>
                    {/* <span className="text-secondary ">
                      INCREASE <strong>12%</strong> VS LAST MONTH
                    </span> */}
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-wallet fs-3 h-100"></i>
                    <h3>Total Paid</h3>
                  </div>

                  <div className=" mt-2">
                    <h1
                      // className="payable-amount"
                      title={totalPaid?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      style={{ cursor: "pointer", color: "rgb(40, 209, 40)" }}
                    >
                      {widgetCurrencySymbol}{" "}
                      {totalPaid?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                      {/* {widgetCurrencySymbol}{" "}
                      {totalPaid ? compactNumberFormat(totalPaid) : "0.00"} */}
                    </h1>
                  </div>
                </div>
              </div>
              {/* <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-credit-card fs-3 h-100"></i>
                    <h3>Paid this Month</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <h1 className="payable-amounts">85,000</h1>
                    <span className="text-secondary ">
                      <strong>16%</strong> INCREASE
                    </span>
                  </div>
                </div>
              </div> */}
            </div>
            {/* <div className="row mx-auto">
              <div className="col-sm mb-2">
                <label htmlFor="">Status</label>
                <select name="" id="" className="form-select p-2">
                  <option value="" selected disabled>
                    Select Status
                  </option>
                  <option value="Paid">Paid</option>
                  <option value="Not Paid">Not Paid</option>
                </select>
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                <button className="btn w-100">Apply Filter</button>
                <button
                  className="btn btn-secondary w-100"
                  onClick={clearFilter}
                >
                  Clear Filter
                </button>
              </div>
              <div className="col-sm mb-2"></div>
              <div className="col-sm mb-2"></div>
              <div className="col-sm mb-2"></div>
            </div> */}
            <div className="row mx-auto mt-2">
              <div className="col-sm mb-2">
                <label htmlFor="">Cutoff</label>
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select p-2"
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
                </select>
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="cutoff-start-date">From</label>
                {/* <input
                  type="date"
                  value={cutOffDate?.from || ""}
                  id="cutoff-start-date"
                  className="form-control"
                  readOnly
                /> */}
                <DatePicker
                  selected={cutOffDate?.from}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="cutoff-end-date">To</label>
                {/* <input
                  type="date"
                  value={cutOffDate?.to || ""}
                  id="cutoff-end-date"
                  className="form-control"
                  readOnly
                /> */}
                <DatePicker
                  selected={cutOffDate?.to}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button className="btn w-100">Apply Filter</button>
                <button
                  className="btn btn-secondary w-100"
                  onClick={clearFilter}
                >
                  Clear Filter
                </button> */}
              </div>
            </div>
          </div>
          <div className="w-100 mt-2 container-fluid">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchText}
                onChange={handleSearch}
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
                      filterColumn === "transaction_no" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("transaction_no")}
                  >
                    Transaction No.
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "date_created" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("date_created")}
                  >
                    Date Created
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "transaction_date" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("transaction_date")}
                  >
                    Transaction Date
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "total_amount" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("total_amount")}
                  >
                    Total Amount
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
              columns={columns}
              data={payable}
              customStyles={customStyles}
              onRowClicked={handleRowClick}
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

export default Overseas_purchase;
