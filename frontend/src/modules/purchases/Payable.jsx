import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import { Link, useNavigate } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";

const Payable = ({ authrztn, roleType }) => {
  const userLoggedID = useDecodeToken();
  const [payable, setPayable] = useState([]);
  const [cutoff, setCutoff] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date

  // handle change select cutoff date
  const handleSelect = (e) => {
    const [filteredCutoff] = cutOffs.filter((item) => {
      return item.id == e.target.value;
    });

    setSelectedCutOff(filteredCutoff);
    fetchData(filteredCutoff);
    getLastCutoffPayable(filteredCutoff);
    getCurrentTotalPayable(filteredCutoff);
    getCurrentCutoffPayable(filteredCutoff);
    getTotalDiscount(filteredCutoff);
    getTotalIssued(filteredCutoff);
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
          const [filteredCutoff] = cutOffs.filter((item) => {
            return item.id == selectedCutOff?.id;
          });
          setSelectedCutOff(filteredCutoff); // set default cut off
          fetchData(filteredCutoff);
          getLastCutoffPayable(filteredCutoff);
          getCurrentTotalPayable(filteredCutoff);
          getCurrentCutoffPayable(filteredCutoff);
          getTotalDiscount(filteredCutoff);
          getTotalIssued(filteredCutoff);
        } else {
          setCutOffs(res.data); // store all cut off
          setSelectedCutOff(defaultCutOff); // set default cut off
          fetchData(defaultCutOff);
          getLastCutoffPayable(defaultCutOff);
          getCurrentTotalPayable(defaultCutOff);
          getCurrentCutoffPayable(defaultCutOff);
          getTotalDiscount(defaultCutOff);
          getTotalIssued(defaultCutOff);
        }
      })
      .catch((err) => {
        console.log(err);
      });
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

  const handleVendorChange = (event) => {
    setSelectedVendor(event.target.value);
  };

  const handleFromDateChange = (event) => {
    setFromDate(event.target.value);
  };

  const handleToDateChange = (event) => {
    setToDate(event.target.value);
  };

  const applyFilter = () => {
    const filtered = payable.filter((row) => {
      const isVendorMatch =
        !selectedVendor || row.vendor.company_name === selectedVendor;

      const isDateMatch =
        (!fromDate || new Date(row.due_date) >= new Date(fromDate)) &&
        (!toDate || new Date(row.due_date) <= new Date(toDate));

      return isVendorMatch && isDateMatch;
    });

    setFilteredData(filtered);
  };

  const clearFilter = () => {
    setSelectedVendor("");
    setFromDate("");
    setToDate("");
    setFilteredData(payable);
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
      name: <div className="text-nowrap">Transaction Date</div>,
      id: "payable",
      selector: (row) => format(row.createdAt, "MMM/dd/yyyy, hh:mm a"),
      cell: (row) => (
        <div className="text-nowrap text-center">
          {format(row.createdAt, "MMM/dd/yyyy, hh:mm a")}
        </div>
      ),
    },
    {
      name: "Transaction No.",
      id: "payable",
      selector: (row) => row.transaction_id,
      cell: (row) => (
        <div className="text-nowrap text-center">{row.transaction_id}</div>
      ),
    },
    {
      name: "Receiving Warehouse",
      id: "payable",
      selector: (row) => row.warehouse.name,
      cell: (row) => <div className="text-center">{row.warehouse.name}</div>,
    },
    {
      name: "Mode of Payment",
      id: "payable",
      selector: (row) =>
        row.MOP === null ? (
          <div className="text-center">No Payment Chosen</div>
        ) : (
          <div className="text-center">{row.MOP}</div>
        ),
    },
    {
      name: "Vendor",
      id: "payable",
      selector: (row) => (
        <div className="text-center">{row.vendor.company_name}</div>
      ),
    },
    {
      name: "Discount",
      id: "payable",
      selector: (row) => (
        <div className="text-center">{row.discount_value}</div>
      ),
    },
    {
      name: "Container Number",
      id: "payable",
      selector: (row) => row.container_number,
      cell: (row) => (
        <div className="text-center">{row.container_number || "n/a"}</div>
      ),
    },
    {
      name: "Pier",
      id: "payable",
      selector: (row) => row.pier,
      cell: (row) => <div className="text-center">{row.pier || "n/a"}</div>,
    },
    {
      name: "Destination",
      id: "payable",
      selector: (row) => row.domestic_type,
      cell: (row) => (
        <div className="text-center">
          {row.domestic_type === "local" ? "Local" : "Overseas"}
        </div>
      ),
    },
    {
      name: "Due Date",
      id: "payable",
      selector: (row) => (
        <div className="text-center">
          {format(row.due_date, "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      name: "Purchase Date",
      id: "payable",
      selector: (row) => (
        <div className="text-center">
          {format(row.purchaseDate, "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      name: "Total Amount",
      id: "payable",
      cell: (row) => {
        let unitPrice = 0;
        // row.payable_products.forEach((data) => {
        //   unitPrice += data.product_tag_vendor.product_price * data.weight;
        // });
        row.payable_products.forEach((data) => {
          unitPrice += data.unitPrice * data.weight;
        });

        const moisture = row.payable_products.reduce((acc, data) => {
          if (data.moisture_type === "%") {
            return (
              acc +
              parseFloat(
                (data.moisture / 100) * data.unitPrice * data.weight || 0
              )
            );
          } else {
            return acc + parseFloat(data.moisture || 0);
          }
        }, 0);

        const totalOtherFees = row.payable_other_fees.reduce(
          (acc, data) => acc + parseFloat(data.fee_amount || 0),
          0
        );

        const calculateDiscount =
          row.isPercent_Discount === true
            ? (row.discount_value / 100) *
              parseFloat(
                unitPrice - moisture - row.weighing_fee - totalOtherFees
              )
            : row.discount_value;

        return (
          <span className="text-center">
            {row.currency?.currency_name}{" "}
            {(
              unitPrice -
              moisture -
              row.weighing_fee -
              totalOtherFees -
              calculateDiscount
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        );
      },
    },
    // {
    //   name: "Amount to Pay",
    //   id: "payable",
    //   selector: (row) => row.amountToPay,
    // },
    {
      name: "Status",
      id: "payable",
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
          case "Paid":
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

  if (authrztn.includes("Payable-Delete")) {
    columns.push({
      name: "Action",
      id: "payable",
      selector: (row) => (
        <i
          className="fas fa-trash text-center"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() =>
            handleDeletePayable(row.id, row.purchaseDate, row.transaction_id)
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
            `${BASE_URL}/payable/deletePayable/`,
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
              title: "Payable Deleted Successfully!",
              text: "The payable has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              fetchCutOff();
            });
          } else if (response.status === 201) {
            swal({
              title: "Delete Prohibited!",
              text: `Payable date (${response.data.purchase_date}) cannot be deleted as its payable date falls within the posted cutoff period named "${response.data.cutoff_name}".`,
              icon: "warning",
              button: "OK",
            });
          } else if (response.status === 202) {
            const { transactionNumber, moduleType } = response.data;
            let moduleFrom;
            if (moduleType === "local") {
              moduleFrom = "Local Purchase";
            } else {
              moduleFrom = "Overseas Purchase";
            }
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the purchase in module <strong>${moduleFrom}</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 203) {
            const { transactionNumber } = response.data;

            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the production in module <strong>${`Productions`}</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 207) {
            const { transactionNumber } = response.data;
            // console.log(response.data);
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the sales in module <strong>${`Sales Invoice`}</strong> with 
                              Transaction Number: <strong>${transactionNumber}</strong>
                            </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 208) {
            const { transactionNumber } = response.data;
            // console.log(response.data);
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              Delete first the stock transfered in module <strong>${`Stock Transfer`}</strong> with 
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
            text: "An error occurred while deleting the invoice.",
          });
        }
      }
    });
  };

  const [totalPurchase, setTotalPurchase] = useState(0);

  const [lastCutoffPayable, setLastCutoffPayable] = useState(0);
  const [currentTotalPayable, setCurrentTotalPayable] = useState(0);
  const [currentCutoffPayable, setCurrentCutoffPayable] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalIssued, setTotalIssued] = useState(0);
  const pagination = useServerPagination(BASE_URL + "/payable/fetch", 10);

  const fetchData = (cutOff) => {
    pagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      filterColumn,
      searchText,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/payable/fetch", {
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
    //     const calculatedTotal = calculateTotalPurchase(res.data);
    //     setTotalPurchase(calculatedTotal);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     setIsLoading(true);
    //   });
  };

  const getLatestCutoff = () => {
    axios
      .get(BASE_URL + "/payable/getLatestCutoff")
      .then((res) => {
        setCutoff(res.data?.name);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(true);
      });
  };

  const getLastCutoffPayable = (cutOff) => {
    axios
      .get(BASE_URL + "/payable/fetchPreviousCutoffPayable", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
        },
      })
      .then((res) => {
        setLastCutoffPayable(res.data.totalPrice);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getCurrentTotalPayable = (cutOff) => {
    axios
      .get(BASE_URL + "/payable/fetchCurrentTotalPayable", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
        },
      })
      .then((res) => {
        setCurrentTotalPayable(res.data.totalPrice);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getCurrentCutoffPayable = (cutOff) => {
    axios
      .get(BASE_URL + "/payable/fetchCurrentCutoffPayable", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
        },
      })
      .then((res) => {
        setCurrentCutoffPayable(res.data.totalPrice);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getTotalDiscount = (cutOff) => {
    axios
      .get(BASE_URL + "/payable/fetchTotalDiscount", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
        },
      })
      .then((res) => {
        setTotalDiscount(res.data.totalDiscount);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getTotalIssued = (cutOff) => {
    axios
      .get(BASE_URL + "/payable/fetchTotalIssued", {
        params: {
          startDate: cutOff?.from,
          endDate: cutOff?.to,
        },
      })
      .then((res) => {
        setTotalIssued(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      getLatestCutoff();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchCutOff();
  }, [searchText]);

  useEffect(() => {
    const filtered = payable.filter((row) => {
      const rowData = Object.values(row)
        .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
        .join(" ");
      return rowData.includes(searchKeyword.toLowerCase());
    });
    setFilteredData(filtered);
  }, [searchKeyword, payable]);

  useEffect(() => {
    setPayable(pagination.data);
    const calculatedTotal = calculateTotalPurchase(pagination.data);
    setTotalPurchase(calculatedTotal);
  }, [pagination]);

  const calculateApprovedTotal = (rows) => {
    return rows
      .filter((row) => row.status === "Approved")
      .reduce((total, row) => {
        let unitPrice = 0;
        row.payable_products.forEach((data) => {
          unitPrice += data.product_tag_vendor.product_price * data.weight;
        });

        const moisture = row.payable_products.reduce((acc, data) => {
          if (data.moisture_type === "%") {
            return (
              acc +
              parseFloat(
                (data.moisture / 100) *
                  data.product_tag_vendor.product_price *
                  data.weight || 0
              )
            );
          } else {
            return acc + parseFloat(data.moisture || 0);
          }
        }, 0);

        const totalOtherFees = row.payable_other_fees.reduce(
          (acc, data) => acc + parseFloat(data.fee_amount || 0),
          0
        );

        const calculateDiscount =
          row.isPercent_Discount === true
            ? (row.discount_value / 100) *
              parseFloat(
                unitPrice - moisture - row.weighing_fee - totalOtherFees
              )
            : row.discount_value;

        const rowTotal =
          unitPrice -
          moisture -
          row.weighing_fee -
          totalOtherFees -
          calculateDiscount;

        return total + rowTotal;
      }, 0);
  };

  const calculatedTotalPaid = (rows) => {
    return rows
      .filter((row) => row.status === "Paid")
      .reduce((total, row) => {
        let unitPrice = 0;
        row.payable_products.forEach((data) => {
          unitPrice += data.product_tag_vendor.product_price * data.weight;
        });

        const moisture = row.payable_products.reduce((acc, data) => {
          if (data.moisture_type === "%") {
            return (
              acc +
              parseFloat(
                (data.moisture / 100) *
                  data.product_tag_vendor.product_price *
                  data.weight || 0
              )
            );
          } else {
            return acc + parseFloat(data.moisture || 0);
          }
        }, 0);

        const totalOtherFees = row.payable_other_fees.reduce(
          (acc, data) => acc + parseFloat(data.fee_amount || 0),
          0
        );

        const calculateDiscount =
          row.isPercent_Discount === true
            ? (row.discount_value / 100) *
              parseFloat(
                unitPrice - moisture - row.weighing_fee - totalOtherFees
              )
            : row.discount_value;

        const rowTotal =
          unitPrice -
          moisture -
          row.weighing_fee -
          totalOtherFees -
          calculateDiscount;

        return total + rowTotal;
      }, 0);
  };

  const calculateTotalPurchase = (rows) => {
    return rows.reduce((total, row) => {
      let unitPrice = 0;
      row.payable_products.forEach((data) => {
        unitPrice += data.product_tag_vendor.product_price * data.weight;
      });

      const moisture = row.payable_products.reduce((acc, data) => {
        if (data.moisture_type === "%") {
          return (
            acc +
            parseFloat(
              (data.moisture / 100) *
                data.product_tag_vendor.product_price *
                data.weight || 0
            )
          );
        } else {
          return acc + parseFloat(data.moisture || 0);
        }
      }, 0);

      const totalOtherFees = row.payable_other_fees.reduce(
        (acc, data) => acc + parseFloat(data.fee_amount || 0),
        0
      );

      const calculateDiscount =
        row.isPercent_Discount === true
          ? (row.discount_value / 100) *
            parseFloat(unitPrice - moisture - row.weighing_fee - totalOtherFees)
          : row.discount_value;

      const rowTotal =
        unitPrice -
        moisture -
        row.weighing_fee -
        totalOtherFees -
        calculateDiscount;

      return total + rowTotal;
    }, 0);
  };

  const calculateTotalDiscount = (rows) => {
    return rows.reduce((totalDiscount, row) => {
      const unitPrice = row.payable_products.reduce(
        (sum, data) =>
          sum + data.product_tag_vendor.product_price * data.weight,
        0
      );

      const moisture = row.payable_products.reduce((acc, data) => {
        if (data.moisture_type === "%") {
          return (
            acc +
            parseFloat(
              (data.moisture / 100) *
                data.product_tag_vendor.product_price *
                data.weight || 0
            )
          );
        } else {
          return acc + parseFloat(data.moisture || 0);
        }
      }, 0);

      const totalOtherFees = row.payable_other_fees.reduce(
        (acc, data) => acc + parseFloat(data.fee_amount || 0),
        0
      );

      const discount =
        row.isPercent_Discount === true
          ? (row.discount_value / 100) *
            parseFloat(unitPrice - moisture - row.weighing_fee - totalOtherFees)
          : row.discount_value;

      return totalDiscount + discount;
    }, 0);
  };

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  const maskCurrency = (value) => {
    return Number(value)
      .toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      .replace(/[0-9]/g, "*");
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
      ) : authrztn.includes("Payable-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">
                PAYABLE
                {/* -- {cutoff} */}
              </span>
            </div>

            <div>
              {authrztn.includes("Payable-Add") && (
                <Link
                  to="/purchases/create_payable"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              )}
            </div>
          </div>
          <div className="container-fluid ">
            {/* <div className="row p-2 mx-auto">
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                    <h3>Total Purchase</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <h1 className="payable-amount">
                      {" "}
                      {calculateTotalPurchase(filteredData).toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-wallet fs-3 h-100"></i>
                    <h3>Total Payable</h3>
                  </div>

                  <div className=" mt-2">
                    <h1 className="payable-amount">
                      {calculateApprovedTotal(filteredData).toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-credit-card fs-3 h-100"></i>
                    <h3>Total Discount</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <h1 className="payable-amount">
                      {" "}
                      {calculateTotalDiscount(filteredData).toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-credit-card fs-3 h-100"></i>
                    <h3>Paid</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <h1 className="payable-amount">
                      {calculatedTotalPaid(filteredData).toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </h1>
                  </div>
                </div>
              </div>
            </div> */}

            <div className="row p-2 mx-auto">
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                    <h3 className="fs-5">Last Cut-off Payable</h3>
                  </div>

                  <div className=" mt-4 d-flex flex-column payable-card-desc">
                    <h1
                      className="payable-amount text-nowrap"
                      style={{ fontSize: "2rem" }}
                    >
                      {roleType?.includes("Management") ? (
                        Number(lastCutoffPayable).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      ) : (
                        <span style={{ fontSize: "2rem" }}>
                          {maskCurrency(100)}
                        </span>
                      )}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-wallet fs-3 h-100"></i>
                    <h3 className="fs-5">Current Total Payable</h3>
                  </div>

                  <div className=" mt-4">
                    <h1
                      className="payable-amount text-nowrap"
                      style={{ fontSize: "2rem" }}
                    >
                      {roleType?.includes("Management") ? (
                        Number(currentTotalPayable).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      ) : (
                        <span style={{ fontSize: "2rem" }}>
                          {maskCurrency(100)}
                        </span>
                      )}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="d-flex flex-column w-100 border p-3 shadow-sm rounded h-100">
                  <div className="d-flex flex-row align-items-center payable-icon pt-2">
                    <i class="bx pt-1 bx-wallet fs-3 h-100"></i>
                    <h3 className="fs-4">Total Discount</h3>
                  </div>

                  <div className="mt-auto">
                    <h1
                      className="payable-amount text-nowrap"
                      style={{ fontSize: "2rem" }}
                    >
                      {roleType?.includes("Management") ? (
                        Number(totalDiscount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      ) : (
                        <span style={{ fontSize: "2rem" }}>
                          {maskCurrency(100)}
                        </span>
                      )}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="d-flex flex-column w-100 border p-3 shadow-sm rounded h-100">
                  <div className="d-flex flex-row align-items-center payable-icon pt-2">
                    <i class="bx pt-1 bx-credit-card fs-3 h-100"></i>
                    <h3 className="fs-4">Total Issued</h3>
                  </div>

                  <div className=" mt-auto d-flex flex-column payable-card-desc">
                    <h1
                      className="payable-amount text-nowrap"
                      style={{ fontSize: "2rem" }}
                    >
                      {roleType?.includes("Management") ? (
                        Number(totalIssued).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      ) : (
                        <span style={{ fontSize: "2rem" }}>
                          {maskCurrency(100)}
                        </span>
                      )}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-credit-card fs-3 h-100"></i>
                    <h3 className="fs-5">Current cut-off Payable</h3>
                  </div>

                  <div className=" mt-4 d-flex flex-column payable-card-desc">
                    <h1
                      className="payable-amount text-nowrap"
                      style={{ fontSize: "2rem" }}
                    >
                      {roleType?.includes("Management") ? (
                        Number(currentCutoffPayable).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      ) : (
                        <span style={{ fontSize: "2rem" }}>
                          {maskCurrency(100)}
                        </span>
                      )}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mx-auto mt-2">
              <div className="col-sm mb-2">
                <label htmlFor="vendor">Cutoff</label>
                {/* <select
                  name="vendor"
                  id="vendor"
                  className="form-select"
                  value={selectedVendor}
                  onChange={handleVendorChange}
                >
                  <option value="" disabled>
                    Select Vendor
                  </option>
                  {[
                    ...new Set(payable.map((row) => row.vendor.company_name)),
                  ].map((vendorName, index) => (
                    <option key={index} value={vendorName}>
                      {vendorName}
                    </option>
                  ))}
                </select> */}
                <select
                  value={selectedCutOff?.id}
                  onChange={handleSelect}
                  className="form-select"
                >
                  {cutOffs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-sm mb-2">
                <label htmlFor="fromDate">From</label>
                {/* <input
                  type="date"
                  id="fromDate"
                  className="form-control"
                  value={cutOffDate?.from || ""}
                  readOnly
                  onChange={handleFromDateChange}
                /> */}
                <DatePicker
                  selected={cutOffDate?.from}
                  dateFormat="MMM dd, yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="toDate">To</label>
                {/* <input
                  type="date"
                  id="toDate"
                  className="form-control"
                  value={cutOffDate?.to || ""}
                  readOnly
                  onChange={handleToDateChange}
                /> */}
                <DatePicker
                  selected={cutOffDate?.to}
                  dateFormat="MMM dd, yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button className="btn w-100" onClick={applyFilter}>
                  Apply Filter
                </button>
                <button
                  className="btn btn-secondary w-100"
                  onClick={clearFilter}
                >
                  Clear Filter
                </button> */}
              </div>
            </div>

            <div className="w-100 mt-2 container-fluid">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                {/* <button
                  type="button"
                  className="btn btn-outline-secondary dropdown-toggle-split"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-sliders"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button className={`dropdown-item `}>Company Name</button>
                  </li>
                  <li>
                    <button className={`dropdown-item `}>Company Nature</button>
                  </li>
                  <li>
                    <button className={`dropdown-item`}>Country</button>
                  </li>
                  <li>
                    <button className={`dropdown-item `}>Contact Person</button>
                  </li>
                  <li>
                    <button className={`dropdown-item `}>Contact Number</button>
                  </li>
                </ul> */}
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
                        filterColumn === "transaction_id" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("transaction_id")}
                    >
                      Transaction No.
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "receiving_warehouse" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("receiving_warehouse")}
                    >
                      Receiving Warehouse
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "MOP" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("MOP")}
                    >
                      Mode of Payment
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "company_name" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("company_name")}
                    >
                      Vendor
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "discount_value" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("discount_value")}
                    >
                      Discount
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "due_date" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("due_date")}
                    >
                      Due Date
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "purchaseDate" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("purchaseDate")}
                    >
                      Purchase Date
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
            <div
              className="mt-3 container-fluid"
              style={{ maxWidth: "78.5vw" }}
            >
              <DataTable
                columns={columns}
                data={filteredData}
                customStyles={customStyles}
                highlightOnHover
                className="dataTable"
                onRowClicked={(row) =>
                  navigate(`../purchases/purchase-pay/${row.id}`)
                }
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

export default Payable;
