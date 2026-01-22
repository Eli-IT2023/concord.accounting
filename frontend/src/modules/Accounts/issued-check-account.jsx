import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import swal from "sweetalert";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import Select from "react-select";
import { selectCustomStyles } from "../../assets/global/selectCustomStyles";
import { compactNumberFormat } from "../../utils/numberFormatter";
import DateRangePicker from "../../components/DateRangePicker";
import { Tab, Tabs } from "react-bootstrap";
import { useMemo } from "react";
import { getMonthBoundaries, initializeCutoff } from "../../utils/newdate";

const IssuedCheckAccount = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const [selectedAccount, setSelectedAccount] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [uniqueAccounts, setUniqueAccounts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [show, setShow] = useState(false);
  const handleCloseModal = () => setShow(false);
  const handleShowModal = () => setShow(true);
  const [currencyRate, setCurrencyRate] = useState("");
  const [issuedCheckRowData, setIssuedCheckRowData] = useState([]);
  const [paymentData, setPaymentData] = useState({});

  const [inboundData, setInboundData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date
  const [activeTab, setActiveTab] = useState("pending");

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
    // setSelectedAccount("");
    reloadTable(filteredCutoff, selectedAccount?.value);
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
    //     if (selectedCutOff) {
    //       const filteredCutoff = handleCutoffChange(selectedCutOff?.id);
    //       setSelectedCutOff(filteredCutoff);
    //       reloadTable(filteredCutoff, selectedAccount?.value);
    //     } else {
    //       setCutOffs(res.data);
    //       setSelectedCutOff(defaultCutOff);
    //       reloadTable(defaultCutOff, selectedAccount?.value);
    //       fetchAccountListSub3();
    //     }
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    setSelectedCutOff(initialCutoff);
    setCutOffDate(initialCutoff);
    setTimeout(() => {
      reloadTable(initialCutoff, selectedAccount?.value);
      fetchAccountListSub3();
    }, 100);
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
    BASE_URL + "/issuedCheck/getFilteredIssuedCheck",
    10
  );

  const reloadTable = (cutOff, accountsName) => {
    pagination.updateParams({
      startDate: cutOff?.from,
      endDate: cutOff?.to,
      accountsName,
      filterColumn,
      searchText,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/issuedCheck/getFilteredIssuedCheck", {
    //     params: {
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       accountsName,
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     // const response = res.data;
    //     // const accountNames = response.map(
    //     //   (item) => item.account_list_id_issued_froms?.account_name
    //     // );
    //     // const uniqueAccountsSet = [...new Set(accountNames)];
    //     // console.log(uniqueAccountsSet);
    //     // setUniqueAccounts(uniqueAccountsSet);
    //     setInboundData(res.data);
    //     setFilteredData(res.data);
    //     console.log(res.data);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => console.log(err));
  };

  const fetchAccountListSub3 = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/issuedCheck/getAccountListSub3`
      );
      const accountNames = response.data.map((item) => {
        return {
          id: item.id,
          account_name: item.account_name,
          module_type: item.account_list_base_sub.module_type,
        };
      });
      const uniqueAccountsSet = [...new Set(accountNames)];
      setUniqueAccounts(uniqueAccountsSet);
    } catch (error) {
      console.error(error);
    }
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchCutOff();
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, [searchText]);

  useEffect(() => {
    setInboundData(pagination.data);
    setFilteredData(pagination.data);
  }, [pagination.data]);

  // useEffect(() => {
  //   fetchCutOff();
  // }, [searchText]);

  // useEffect(() => {
  //   setSearchText("");
  //   fetchCutOff();
  // }, [filterColumn]);

  useEffect(() => {
    if (selectedAccount && filterColumn == "account_name") {
      setFilterColumn("all");
    }
  }, [selectedAccount]);

  const dataList = inboundData?.map((data, i) => {
    const transactionDate = new Date(data.transaction_date);
    const formattedDate = transactionDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return {
      key: i,
      id: data.id,
      account_list_id_issued_from: data.account_list_id_issued_from,
      account_list_id_issued_to: data.account_list_id_issued_to,
      account_list_id_issued_froms: data.account_list_id_issued_froms,
      account_list_id_issued_tos: data.account_list_id_issued_tos,
      transaction_date: data.transaction_date,
      check_number: data.check_number,
      transaction_number: data.transaction_number,
      module_from: data.module_from,
      description: data.description,
      amount: data.amount,
      status: data.status,
    };
  });

  const handlePay = async (
    id,
    account_list_id_issued_from,
    amount,
    checkNo,
    date,
    transaction_number,
    module_from,
    description,
    currency,
    rowData
  ) => {
    console.log(rowData);
    const amountToUse =
      rowData.amount_to_deduct != null ? rowData.amount_to_deduct : amount;

    console.log("amoun to use", amountToUse, rowData.amount_to_deduct);

    const res = await axios.get(
      `${BASE_URL}/issuedCheck/validateIssuedCheck/${account_list_id_issued_from}`
    );
    if (amountToUse > res.data.amount) {
      swal({
        title: "Oppss!",
        text: "Insufficient Balance",
        icon: "error",
        buttons: false,
        timer: 2000,
      });
      return;
    }

    // if (currency.currency_name !== "PHP" || currency.id !== 1) {
    //   setIssuedCheckRowData(rowData);
    //   setPaymentData({
    //     id,
    //     account_list_id_issued_from,
    //     amount,
    //     checkNo,
    //     date,
    //     transaction_number,
    //     module_from,
    //     description,
    //     userLoggedID,
    //     rowData,
    //     account_list_id_issued_to: rowData.account_list_id_issued_to,
    //   });
    //   handleShowModal();
    //   return;
    // }

    try {
      const toPay = await swal({
        title: "Are you sure?",
        text: "Once paid, you will not be able to recover this check",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      });
      if (toPay) {
        await axios
          .post(BASE_URL + "/issuedCheck/v2/payIssuedCheck", {
            id,
            account_list_id_issued_from,
            amount,
            checkNo,
            date,
            transaction_number,
            module_from,
            description,
            userLoggedID,
            amountToDeduct:
              rowData.amount_to_deduct != null ? rowData.amount_to_deduct : 0,
            account_list_id_issued_to: rowData.account_list_id_issued_to,
            currencyName: rowData?.currencyName ?? "PHP",
            currencyRate: rowData?.exchangeRate ?? 1,
            rowData,
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Check Paid",
                text: "The check has been paid",
                icon: "success",
                timer: 2000,
              }).then(() => {
                const [filteredCutoff] = cutOffs.filter((item) => {
                  return item.id === selectedCutOff?.id;
                });
                reloadTable(filteredCutoff, null);
              });
            } else {
              swal({
                title: "Something went wrong",
                text: "Please contact your support immediately",
                icon: "error",
                timer: 2000,
              });
            }
          })
          .catch((error) => {
            if (error.response && error.response.status == 409) {
              swal({
                title: "Oopps!",
                text: "Action is prohibited as the Issued date has already been posted",
                icon: "error",
                button: true,
              });
            }
          });
      }
    } catch (error) {
      console.log(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
        timer: 2000,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (currencyRate == "") {
        swal({
          title: "Field required.",
          text: "Please fill in the Foreign rate.",
          icon: "error",
          timer: 2000,
        });
        return;
      }

      const toPay = await swal({
        title: "Are you sure?",
        text: "Once paid, you will not be able to recover this check",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      });

      if (toPay) {
        const {
          id,
          account_list_id_issued_from,
          amount,
          checkNo,
          date,
          transaction_number,
          module_from,
          description,
          userLoggedID,
          rowData,
          account_list_id_issued_to,
        } = paymentData;

        console.log(paymentData, "payment", id);

        await axios
          .post(BASE_URL + "/issuedCheck/payIssuedCheck", {
            id,
            account_list_id_issued_from,
            amount,
            checkNo,
            date,
            transaction_number,
            module_from,
            description,
            userLoggedID,
            issuedCheckRowData,
            currencyRate,
            amountToDeduct:
              issuedCheckRowData.amount_to_deduct != null
                ? issuedCheckRowData.amount_to_deduct
                : 0,
            account_list_id_issued_to,
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Check Paid",
                text: "The check has been paid",
                icon: "success",
                timer: 2000,
              }).then(() => {
                const [filteredCutoff] = cutOffs.filter((item) => {
                  return item.id === selectedCutOff?.id;
                });
                reloadTable(filteredCutoff, null);
                handleCloseModal();
              });
            } else {
              swal({
                title: "Something went wrong",
                text: "Please contact your support immediately",
                icon: "error",
                timer: 2000,
              });
            }
          });
      }
    } catch (error) {
      console.error(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
        timer: 2000,
      });
    }
  };

  // List of currency symbol
  const currencySymbol = {
    PHP: "₱",
    JPY: "¥",
    USD: "$",
    EUR: "€",
    HKD: "HK$",
    CNY: "CN¥",
  };

  // Account Options for dropdown select
  const accountOptions = uniqueAccounts.map((item) => ({
    value: item.id,
    label: `${item.module_type} - ${item.account_name}`,
  }));

  const columns = [
    {
      name: "Bank Account",
      selector: (row) => row.account_list_id_issued_froms?.account_name,
    },
    {
      name: "Issued Date",
      selector: (row) => format(row.transaction_date, "MMM/dd/yyyy"),
    },
    {
      name: "Check Number",
      selector: (row) => row.check_number,
    },
    // {
    //   name: "Transaction #",
    //   selector: (row) => row.transaction_number,
    // },
    {
      name: "Created Date",
      selector: (row) => format(row.createdAt, "MMM/dd/yyyy"),
      // row.createdAt
      //   ? new Date(row.createdAt).toISOString().split("T")[0]
      //   : "N/A",
    },
    {
      name: "Issued To",
      selector: (row) =>
        row.account_list_id_issued_tos?.account_name || row.issuedTo,
    },
    {
      name: "Subject From",
      selector: (row) => row.module_from,
    },
    {
      name: "Description",
      selector: (row) => row.description,
    },
    {
      name: "Amount",
      cell: (row) => (
        <div>
          {
            currencySymbol[
              row.account_list_id_issued_froms.currency.currency_name
            ]
          }
          {row.amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
    {
      name: "Exchange Rate Used",
      cell: (row) => (
        <div>
          {currencySymbol["PHP"]}
          {row.exchangeRate.toLocaleString("en-US", {
            minimumFractionDigits: String(row.exchangeRate).length > 4 ? 3 : 2,
            maximumFractionDigits: String(row.exchangeRate).length > 4 ? 3 : 2,
          })}
        </div>
      ),
    },
    {
      name: "Converted Amount",
      cell: (row) => (
        <div>
          {currencySymbol["PHP"]}
          {row.convertedAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => (
        <div
          style={{
            padding: "5px 10px",
            borderRadius: "5px",
            color: row.status
              ? row.status === "Pending"
                ? "#FFA500"
                : "#3B9F3F"
              : "initial",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          {row.status}
        </div>
      ),
    },
    {
      name: "Action",
      cell: (row) => {
        const issuedDate = new Date(row.transaction_date); // Convert Issued Date to Date object
        const today = new Date(); // Get today's date
        const isDatePast = issuedDate < today; // Check if the Issued Date is past

        const filteredData = dataList.filter((item) => {
          const isAccountMatch = selectedAccount
            ? item.account_list_id_issued_from === selectedAccount
            : true;

          const isDateMatch =
            dateFrom && dateTo
              ? new Date(item.transaction_date) >= new Date(dateFrom) &&
                new Date(item.transaction_date) <= new Date(dateTo)
              : true;

          const isKeywordMatch = searchKeyword
            ? Object.values(item)
                .join(" ")
                .toLowerCase()
                .includes(searchKeyword.toLowerCase())
            : true;

          return isAccountMatch && isDateMatch && isKeywordMatch;
        });

        return (
          <div>
            <button
              onClick={() => {
                const rowData = inboundData.find((data) => data.id == row.id);

                handlePay(
                  row.id,
                  row.account_list_id_issued_from,
                  row.amount,
                  row.check_number,
                  row.transaction_date,
                  row.transaction_number,
                  row.module_from,
                  row.description,
                  row.account_list_id_issued_froms.currency,
                  rowData
                );
              }}
              className={`btn btn-primary ${
                row.status !== "Pending" || !isDatePast ? "disabled" : ""
              }`}
              disabled={row.status !== "Pending" || !isDatePast}
              style={{
                cursor:
                  row.status !== "Pending" || !isDatePast
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Pay
            </button>
          </div>
        );
      },
    },
  ];
  // if (authrztn.includes("IssuedCheck-Delete")) {
  //   columns.push({
  //     name: "",
  //     selector: (row) =>
  //       [
  //         "Local Expenses",
  //         "Overseas Expenses",
  //         "Local Payable",
  //         "Overseas Payable",
  //       ].includes(row.module_from) ? (
  //         <i
  //           className="fas fa-trash"
  //           style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
  //           onClick={() =>
  //             handleDeleteIssuedCheck(row.id, row.transaction_date)
  //           }
  //         ></i>
  //       ) : null,
  //   });
  // }

  // const handleDeleteIssuedCheck = async (issuedCheckId, issuedCheckDate) => {
  //   swal({
  //     title: "Confirm Deletion",
  //     text: "Are you sure you want to delete?",
  //     icon: "warning",
  //     buttons: true,
  //     dangerMode: true,
  //   }).then(async (willDelete) => {
  //     if (willDelete) {
  //       try {
  //         const response = await axios.delete(
  //           `${BASE_URL}/issuedCheck/deleteIssuedCheck/${issuedCheckId}/${issuedCheckDate}`
  //         );
  //         if (response.status === 200) {
  //           swal({
  //             title: "Issued Check Deleted Successfully!",
  //             text: "The issued check has been successfully deleted.",
  //             icon: "success",
  //             button: "OK",
  //           }).then(() => {
  //             reloadTable();
  //           });
  //         } else if (response.status === 202) {
  //           const { dateIssued, CutoffName } = response.data;
  //           swal({
  //             title: "Delete Prohibited!",
  //             text: `Issued check cannot be deleted as its date issued (${dateIssued}) falls within the posted cutoff period named "${CutoffName}".`,
  //             icon: "warning",
  //             button: "OK",
  //           });
  //         } else if (response.status === 203) {
  //           swal({
  //             icon: "error",
  //             title: "Something went wrong",
  //             text: "Please contact our support team for assistance.",
  //           });
  //         } else {
  //           swal({
  //             icon: "error",
  //             title: "Something went wrong",
  //             text: "Please contact our support team for assistance.",
  //           });
  //         }
  //       } catch (err) {
  //         console.log(err);
  //         swal({
  //           icon: "error",
  //           title: "Error",
  //           text: "An error occurred while deleting the collection.",
  //         });
  //       }
  //     }
  //   });
  // };

  useEffect(() => {
    console.log("Dataaa", dataList);
  }, [dataList]);

  useEffect(() => {
    const filtered = inboundData?.filter((item) => {
      const accountMatch = selectedAccount
        ? item.account_list_id_issued_froms?.account_name === selectedAccount
        : true;
      const dateMatch =
        dateFrom && dateTo
          ? new Date(item.transaction_date) >= new Date(dateFrom) &&
            new Date(item.transaction_date) <= new Date(dateTo)
          : true;
      const keywordMatch = searchKeyword
        ? Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(searchKeyword.toLowerCase())
        : true;

      return accountMatch && dateMatch && keywordMatch;
    });
    setFilteredData(filtered);
  }, [selectedAccount, dateFrom, dateTo, searchKeyword, inboundData]);

  const totalPaid = dataList
    ?.filter((item) => item.status === "Paid")
    .reduce(
      (total, item) =>
        total +
        parseFloat(
          item.amount *
            item.account_list_id_issued_froms?.currency.currency_rate || 0
        ),
      0
    );

  const totalPayable = dataList
    ?.filter((item) => item.status === "Pending")
    .reduce(
      (total, item) =>
        total +
        parseFloat(
          item.amount *
            item.account_list_id_issued_froms?.currency?.currency_rate || 0
        ),
      0
    );

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
    // setSelectedAccount("");
    reloadTable(cutoff, selectedAccount?.value);
  };

  // Calculate tab counts using useMemo
  const pendingCount = useMemo(
    () => inboundData?.filter((d) => d.status === "Pending").length || 0,
    [inboundData]
  );

  const paidCount = useMemo(
    () => inboundData?.filter((d) => d.status === "Paid").length || 0,
    [inboundData]
  );

  // Filter data based on active tab
  const tabFilteredData = useMemo(() => {
    return inboundData?.filter((data) =>
      activeTab === "pending"
        ? data.status === "Pending"
        : data.status === "Paid"
    );
  }, [inboundData, activeTab]);

  // Extract DataTable content into reusable component
  const TabContent = ({ data }) => (
    <div className="data-table-cell-width">
      <DataTable
        columns={columns}
        data={data}
        customStyles={customStyles}
        className="dataTable"
      />
      <PaginationControls {...pagination} />
    </div>
  );

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
      ) : authrztn.includes("IssuedCheck-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Issued Checks</span>
            </div>

            <div>
              {/* <Link
            to="/purchases/create_payable"
            className="btn btn-primary d-flex flex-row align-items-center title-button"
          >
            <i className="bx bx-plus fs-5"></i> Create
          </Link> */}
            </div>
          </div>
          <div className="container-fluid">
            <div className="row p-2 mx-auto">
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-bar-chart-alt fs-3 h-100"></i>
                    <h3>Total Paid</h3>
                  </div>

                  <div className="mt-2 d-flex flex-column payable-card-desc">
                    <h1
                      className="payable-amount"
                      title={totalPaid.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                      style={{
                        cursor: "default",
                      }}
                    >
                      {totalPaid?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {/* {totalPaid ? compactNumberFormat(totalPaid) : "0.00"} */}
                    </h1>
                    <span className="text-secondary">
                      NUMBER OF TRANSACTION:{" "}
                      <strong>
                        {" "}
                        {
                          dataList?.filter((item) => item.status === "Paid")
                            .length
                        }
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-sm w-100 p-3 payable-card">
                <div className="w-100 border p-3 shadow-sm rounded h-100">
                  <div className=" d-flex flex-row align-items-center payable-icon">
                    <i class="bx bx-credit-card fs-3 h-100"></i>
                    <h3>Total Payable</h3>
                  </div>

                  <div className=" mt-2 d-flex flex-column payable-card-desc">
                    <h1
                      className="payable-amount"
                      title={totalPayable.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                      style={{ cursor: "default" }}
                    >
                      {" "}
                      {totalPayable?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {/* {totalPayable
                        ? compactNumberFormat(totalPayable)
                        : "0.00"} */}
                    </h1>
                  </div>
                </div>
              </div>
            </div>
            <div className="row mx-auto mt-2">
              <div className="col-sm mb-2">
                <label htmlFor="">Account</label>
                {/* <select
                  className="form-select"
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    const [filteredCutoff] = cutOffs.filter((item) => {
                      return item.id === selectedCutOff?.id;
                    });
                    reloadTable(filteredCutoff, e.target.value);
                  }}
                  onMouseDown={(e) => {
                    if (uniqueAccounts.length === 0) {
                      e.preventDefault();
                      swal({
                        icon: "warning",
                        title: "No Account Found",
                        text: "No account found. Please add an account first",
                      });
                      return;
                    }
                  }}
                >
                  <option value="">All Account</option>
                  {uniqueAccounts.map((account, index) => (
                    <option key={index} value={account?.id}>
                      {account?.account_name}
                    </option>
                  ))}
                </select> */}
                <Select
                  options={accountOptions}
                  value={selectedAccount}
                  onChange={(selectedOption) => {
                    setSelectedAccount(selectedOption);

                    // const filteredCutoff = handleCutoffChange(
                    //   selectedCutOff?.id
                    // );

                    const currentCutoff = selectedCutOff || cutOffDate;

                    reloadTable(currentCutoff, selectedOption?.value);
                  }}
                  onMenuOpen={() => {
                    if (uniqueAccounts.length === 0) {
                      swal({
                        icon: "warning",
                        title: "No Account Found",
                        text: "No account found. Please add an account first",
                      });
                      return;
                    }
                  }}
                  menuIsOpen={uniqueAccounts.length === 0 ? false : undefined}
                  placeholder={`All Account`}
                  styles={selectCustomStyles(selectedAccount)}
                  isSearchable
                  isClearable
                />
              </div>
              <div className="col-sm mb-2">
                <DateRangePicker
                  startDate={
                    cutOffDate?.from ? new Date(cutOffDate.from) : null
                  }
                  endDate={cutOffDate?.to ? new Date(cutOffDate.to) : null}
                  onDateRangeChange={handleDateRangeChange}
                  label="Date Range"
                />

                {/* <label htmlFor="cutOff">Cutoff</label>
                <select
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
                <label htmlFor="">From</label>
                <input
                  type="date"
                  name="cutoff-start-date"
                  id="cutoff-start-date"
                  className="form-control"
                  value={cutOffDate?.from}
                  readOnly
                  // onChange={(e) => setDateFrom(e.target.value)}
                />
                <DatePicker
                  selected={cutOffDate?.from}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">To</label>
                <input
                  type="date"
                  className="form-control"
                  name="cutoff-end-date"
                  id="cutoff-end-date"
                  value={cutOffDate?.to}
                  readOnly
                  // onChange={(e) => setDateTo(e.target.value)}
                />
                <DatePicker
                  selected={cutOffDate?.to}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control"
                  readOnly
                />
              </div> */}
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button className="btn w-100">Apply Filter</button>
                <button
                  className="btn btn-secondary w-100"
                  onClick={() => {
                    setSelectedAccount("");
                    setDateFrom("");
                    setDateTo("");
                    setSearchKeyword("");
                    setFilteredData(inboundData); // Reset to original data
                  }}
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
                  {/* <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "account" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("account")}
                  >
                    Account
                  </button>
                </li> */}
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "account_name" ? "active" : ""
                      }`}
                      onClick={() => {
                        setFilterColumn("account_name");
                        setSelectedAccount("");
                      }}
                    >
                      Account Name
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "issued_date" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("issued_date")}
                    >
                      Issued Date
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "check_number" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("check_number")}
                    >
                      Check Number
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "transaction_number" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("transaction_number")}
                    >
                      Transaction #
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "created_date" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("created_date")}
                    >
                      Created Date
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "issued_to" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("issued_to")}
                    >
                      Issued To
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "subject_from" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("subject_from")}
                    >
                      Subject From
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "description" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("description")}
                    >
                      Description
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "amount" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("amount")}
                    >
                      Amount
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
              className="w-100 mt-3 container-fluid"
              style={{ maxWidth: "78.5vw" }}
            >
              <Tabs
                transition={false}
                mountOnEnter
                unmountOnExit={false}
                activeKey={activeTab}
                onSelect={(tab) => setActiveTab(tab)}
                id="issued-check-status-tabs"
                className="mb-3"
              >
                <Tab eventKey="pending" title={`Pending (${pendingCount})`}>
                  <TabContent data={tabFilteredData} />
                </Tab>

                <Tab eventKey="paid" title={`Paid (${paidCount})`}>
                  <TabContent data={tabFilteredData} />
                </Tab>
              </Tabs>
            </div>

            {/* Currency Rate Modal */}
            <Modal show={show} onHide={handleCloseModal}>
              <Modal.Header closeButton>
                <Modal.Title>Currency Rate</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div>
                  <label htmlFor="currency-rate" className="mb-2">
                    Foreign Rate
                  </label>
                  <input
                    type="number"
                    id="currency-rate"
                    name="currency_rate"
                    className="form-control"
                    placeholder="Enter Foreign Rate"
                    value={currencyRate}
                    onChange={(e) => setCurrencyRate(e.target.value)}
                    onKeyDown={(e) => {
                      ["-", "e", "+"].includes(e.key) && e.preventDefault();
                    }}
                    min={0}
                    required
                  />
                </div>
              </Modal.Body>
              <Modal.Footer>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              </Modal.Footer>
            </Modal>
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

export default IssuedCheckAccount;
