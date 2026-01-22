import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  createElement,
} from "react";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import {
  Modal,
  Button,
  Form,
  Table,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import swal from "sweetalert";
// csv
import { CSVLink } from "react-csv";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import Select from "react-select";
import { selectCustomStyles } from "../../assets/global/selectCustomStyles";
import { compactNumberFormat } from "../../utils/numberFormatter";
import CustomDatePicker from "../../components/CustomDatePicker";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import CollectionPdf from "./components/pdf/CollectionPdf";
import CollectionCsv from "./components/csv/CollectionCsv";
import DateRangePicker from "../../components/DateRangePicker";
import { Tab, Tabs } from "react-bootstrap";
import { useMemo } from "react";
import { getMonthBoundaries, initializeCutoff } from "../../utils/newdate";

const Collection = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const csvLinkRef = useRef();
  const [printToPdf, setPrintToPdf] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [validated, setValidated] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [collectionsData, setCollectionsData] = useState([]);
  const [modalSubject, setModalSubject] = useState(false);
  const [subject1, setSubject1] = useState("");
  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject2, setSubject2] = useState("");
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [subject3, setSubject3] = useState("");
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);
  const [currencySelectedId, setCurrencyId] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [selectedRowIssuedDate, setSelectedRowIssuedDate] = useState(null);
  const [transactionNumber, setTransactionNumber] = useState(null);
  const [issuedCheckNumber, setIssuedCheckNumber] = useState(null);
  const [selectedBulkCollectionId, setSelectedBulkCollectionId] =
    useState(null);
  const [selectedCutOff, setSelectedCutOff] = useState(""); // state for input select
  const [cutOffs, setCutOffs] = useState([]); // state for all cut off
  const [cutOffDate, setCutOffDate] = useState(""); // state for input date
  const [widget, setWidget] = useState({});
  const [accountListSub3, setAccountListSub3] = useState([]);
  const selectedAccount = useRef("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [show, setShow] = useState(false);
  const handleCloseModal = () => setShow(false);
  const handleShowModal = () => setShow(true);
  const [currencyRate, setCurrencyRate] = useState("");
  const [paymentData, setPaymentData] = useState({});
  const [claimType, setClaimType] = useState("");
  const [collectionCheckRowData, setCollectionCheckRowData] = useState([]);
  const [isNotPhp, setIsNotPhp] = useState(false);
  const [showReceivingCheckModal, setShowReceivingCheckModal] = useState(false);
  const [subject2LoanDataList, setSubject2LoanDataList] = useState([]);
  const [subject3LoanDataList, setSubject3LoanDataList] = useState([]);
  const [currencyList, setCurrencyList] = useState([]);
  const [loanData, setLoanData] = useState({
    issuedDate: "",
    transactionDate: "",
    subject1: "Liabilities Account",
    subject2: "",
    subject2_name: "",
    subject3: "",
    subject3_name: "",
    checkNumber: "",
    amount: "",
    currency_id: "",
    currency_name: "",
  });

  const [isFromSalesCollection, setIsFromSalesCollection] = useState(false);
  const [isVisibleLiabNote, setIsVisibleLiabNote] = useState(false);
  //for loan
  // const [showAddLoanModal, setShowAddLoanModal] = useState(false);

  const handleCloseReceivingCheckModal = () => {
    setShowReceivingCheckModal(false);
    setLoanData({
      issuedDate: "",
      transactionDate: "",
      subject1: "Liabilities Account",
      subject2: "",
      subject2_name: "",
      subject3: "",
      subject3_name: "",
      checkNumber: "",
      amount: "",
      currency_id: "",
      currency_name: "",
    });
    fetchSubject2Data("Liabilities Account");
    setValidated(false);
  };

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
    fetchCollectionsData(filteredCutoff);
  };

  const handleSelectAccount = (selectedOption) => {
    selectedAccount.current = selectedOption;
    fetchCutoff();
  };

  // set start and end date for input date
  const startAndEndDate = useCallback(() => {
    const filteredCutoff = handleCutoffChange(selectedCutOff?.id);

    setCutOffDate(filteredCutoff); // set state for input date
  }, [cutOffs, selectedCutOff]);

  useEffect(() => {
    startAndEndDate();
  }, [selectedCutOff]);

  const dateValidation = async (selectedDate, clearField, dateLabel, key) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date: selectedDate,
        },
      });
      // if (res.data == false) {
      //   swal({
      //     icon: "error",
      //     title: `Invalid ${dateLabel}`,
      //     text: `Please Create Cutoff for this Date (${format(
      //       selectedDate,
      //       "MMM/dd/yyyy"
      //     )})`,
      //   }).then(() => {
      //     clearField({
      //       ...loanData,
      //       [key]: "",
      //     });
      //   });
      // }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClaimLoan = async (
    id,
    amount,
    checkNumber,
    remarks,
    transactionNumber,
    currency_id,
    // subject2_name,
    // subject3_name,
    subject3,
    date_issued,
    loan_name,
    currency_name,
    rowData
  ) => {
    try {
      // if (currency_name !== "PHP" || currency_id !== 1) {
      //   setPaymentData({
      //     id,
      //     amount,
      //     checkNumber,
      //     remarks,
      //     transactionNumber,
      //     currency_id,
      //     // subject2_name,
      //     // subject3_name,
      //     subject3,
      //     date_issued,
      //     loan_name,
      //     currency_name,
      //     rowData,
      //   });
      //   setClaimType("loan");
      //   handleShowModal();
      //   return;
      // }

      await handleClaimLoanPayment({
        id,
        amount,
        checkNumber,
        remarks,
        transactionNumber,
        currency_id,
        // subject2_name,
        // subject3_name,
        subject3,
        date_issued,
        loan_name,
        currency_name,
        rowData,
      });
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

  const handleClaimLoanPayment = async ({
    id,
    amount,
    checkNumber,
    remarks,
    transactionNumber,
    currency_id,
    // subject2_name,
    // subject3_name,
    subject3,
    date_issued,
    loan_name,
    currency_name,
    rowData,
  }) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("center-swal-text");
    wrapper.innerHTML =
      "Once you claim, you will not be able to recover this check";
    const toPay = await swal({
      title: "Are you sure?",
      content: wrapper,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (toPay) {
      await axios
        .post(BASE_URL + "/loan_outstanding/claimLoan", {
          bulkPaymentId: id,
          amount,
          checkNumber,
          remarks,
          transactionNumber,
          currency_id,
          // subject2_name,
          // subject3_name,
          subject3,
          date_issued,
          loan_name,
          userLoggedID,
          currency_name,
          currencyRate,
          rowData,
        })
        .then((res) => {
          if (res.status === 200) {
            swal({
              title: "Loan Claimed",
              text: "The loan has been claimed",
              icon: "success",
              timer: 2000,
            }).then(() => {
              const [filteredCutoff] = cutOffs.filter((item) => {
                return item.id == selectedCutOff?.id;
              });
              fetchCollectionsData(filteredCutoff);
              setRefreshKey((prev) => prev + 1);
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
  };

  const handleSubmitForeignRateModal = async () => {
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

      switch (claimType) {
        case "loan":
          await handleClaimLoanPayment(paymentData);
          break;

        case "No Check Number":
          await handleClaimPayment(paymentData);
          break;

        default:
          break;
      }

      handleCloseModal();
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

  useEffect(() => {
    console.log("Collect", collectionsData);
  }, [collectionsData]);

  const pagination = useServerPagination(
    BASE_URL + "/outstanding/getOutstandingCollectionData",
    10
  );

  const fetchCollectionsData = (cutOff) => {
    let startDate = "";
    let endDate = "";
    if (cutOff) {
      startDate = cutOff?.from;
      endDate = cutOff?.to;
    } else {
      startDate = cutOffDate?.from;
      endDate = cutOffDate?.to;
    }
    pagination.updateParams({
      dateFrom: cutOff?.from,
      dateTo: cutOff?.to,
      filterColumn,
      searchText,
      accountId: selectedAccount.current?.value,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/outstanding/getOutstandingCollectionData", {
    //     params: {
    //       startDate: cutOff?.from,
    //       endDate: cutOff?.to,
    //       filterColumn,
    //       searchText,
    //       selectedAccount: selectedAccount.current,
    //     },
    //   })
    //   .then((res) => {
    //     const { data, totalClaimed, totalUnclaimed } = res.data;
    //     setWidget((prev) => ({
    //       ...prev,
    //       totalClaimed: totalClaimed,
    //       totalUnclaimed: totalUnclaimed,
    //     }));
    //     setCollectionsData(data);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  };

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
    //     setSelectedCutOff(filteredCutoff);
    //     fetchCollectionsData(filteredCutoff);
    //   } else {
    //     setCutOffs(res.data);
    //     setSelectedCutOff(defaultCutOff);
    //     fetchCollectionsData(defaultCutOff);
    //   }
    // } catch (error) {
    //   console.log(error);
    // }

    const boundaries = getMonthBoundaries();
    const initialCutoff = initializeCutoff(boundaries);

    setSelectedCutOff(initialCutoff);
    setCutOffDate(initialCutoff);
    fetchCollectionsData(initialCutoff);
    fetchAccountListSub3ForSelect();
  };

  useEffect(() => {
    fetchCutoff();
  }, []);

  const fetchAccountListSub3ForSelect = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/outstanding/getAccountListSub3ForSelect`
      );
      setAccountListSub3(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleModalSubject = (
    paymentId,
    currencyId,
    bulkId,
    transactionNumber,
    date_issued,
    rowData
  ) => {
    setCurrencyId(currencyId);
    setSelectedRowId(paymentId);
    setSelectedBulkCollectionId(bulkId);
    setTransactionNumber(transactionNumber);
    setIssuedCheckNumber(rowData.check_number);
    setSelectedRowIssuedDate(date_issued);

    console.log("Payment id ", paymentId);

    if (rowData.bulk_collection) {
      setIsFromSalesCollection(true);
      const { currency } = rowData.bulk_collection;
      setIsNotPhp(
        !(
          currency?.currency_name === "PHP" &&
          currency?.id === "11111111-1111-1111-1111-111111111111"
        )
      );
    } else {
      setIsNotPhp(false);
    }
    setCollectionCheckRowData(rowData);

    setModalSubject(true);
  };

  const handleCloseModalSubject = () => {
    setModalSubject(false);
    setIsFromSalesCollection(false);
    setIsVisibleLiabNote(false);
    setSubject1("");
    setSubject2("");
    setSubject3("");
    setCollectionCheckRowData([]);
    // setShowAddLoanModal(false);
    setIsSubject2Disabled(true);
    setIsSubject3Disabled(true);
  };

  // export
  // const handleExport = () => {
  //   // This function will be called when the export button is clicked
  //   setShowConfirmModal(true);
  // };

  // const exportToCSV = () => {
  //   // Prepare your data for CSV export
  //   const csvData = filteredItems.map((item) => ({
  //     Date: item.date,
  //     "Transaction No": item.transac_no,
  //     Bank: item.bank_name,
  //     Description: item.description,
  //     "Account Name": item.account_name,
  //     Amount: item.amount,
  //     Status: item.status,
  //   }));

  //   return csvData;
  // };

  const handleClaim = async (id, bulkId, date_issued, rowData) => {
    try {
      // if (rowData.bulk_collection) {
      //   if (
      //     rowData?.bulk_collection.currency?.currency_name !== "PHP" ||
      //     rowData?.bulk_collection.currency?.id !== 1
      //   ) {
      //     setPaymentData({
      //       id,
      //       bulkId,
      //       date_issued,
      //       rowData,
      //     });
      //     setClaimType("No Check Number");
      //     handleShowModal();
      //     return;
      //   }
      // }

      console.log(rowData);

      handleClaimPayment({ id, bulkId, date_issued, rowData });
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

  const handleClaimPayment = async ({ id, bulkId, date_issued, rowData }) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("center-swal-text");
    wrapper.innerHTML =
      "Once you claim, you will not be able to recover this check";
    const toPay = await swal({
      title: "Are you sure?",
      content: wrapper,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (toPay) {
      // const paymentData = payments.map((payment) => ({
      //   customerId,
      //   account_list_sub3_id: payment.account_list_sub3_id,
      //   amount: payment.amount,
      //   check_number: payment.check_number,
      //   ref_number: payment.ref_number,
      //   date_issued: payment.date_issued,
      //   payment_type: payment.payment_type,
      // }));
      await axios
        .post(BASE_URL + "/outstanding/claim/no-check", {
          id,
          bulkId,
          userLoggedID,
          date_issued,
          rowData,
          salesJournal: {
            customerId: rowData.bulk_collection.customer_id,
            totalAmount: rowData.amount,
            currencyName: rowData.bulk_collection.currency.currency_name,
            currencyRate: rowData.bulk_collection.currency.currency_rate,
          },
        })
        .then((res) => {
          if (res.status === 200) {
            swal({
              title: "Collections Claimed",
              text: "The collections has been claimed",
              icon: "success",
              timer: 2000,
            }).then(() => {
              fetchCutoff();
              setRefreshKey((prev) => prev + 1);
            });
          }
        })
        .catch((error) => {
          if (error.response) {
            if (error.response.status === 400) {
              swal({
                title: "Bad Request",
                text:
                  error.response.data.message ||
                  "Invalid input or collections not found.",
                icon: "error",
                timer: 2000,
              });
            } else if (error.response.status === 404) {
              swal({
                title: "Collections Not Found",
                text: "The collections you are trying to claim does not exist.",
                icon: "error",
                timer: 2000,
              });
            } else if (error.response.status === 409) {
              swal({
                title: "Oopps!",
                text: "Action is prohibited as the Issued date has already been posted",
                icon: "error",
                button: true,
              });
            } else {
              swal({
                title: "Something went wrong",
                text: "Please contact your support immediately",
                icon: "error",
                timer: 2000,
              });
            }
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
  };

  const handleClaimSubject = async (e, type) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      try {
        console.log(
          // subject1,
          // subject3,
          selectedRowId,
          // selectedBulkCollectionId,
          // userLoggedID,
          // selectedRowIssuedDate,
          // collectionCheckRowData,

          "///////////"
        );
        const wrapper = document.createElement("div");
        wrapper.classList.add("center-swal-text");
        wrapper.innerHTML =
          "Once you claim, you will not be able to recover this check";
        const toPay = await swal({
          title: "Are you sure?",
          content: wrapper,
          icon: "warning",
          buttons: true,
          dangerMode: true,
        });

        if (toPay) {
          if (
            collectionCheckRowData.bulk_collection_id == null &&
            collectionCheckRowData.bulk_collection == null
          ) {
            await axios
              .post(BASE_URL + "/outstanding/claimReceivingCheck", {
                subject1,
                subject3: subject3?.value,
                id: selectedRowId,
                userLoggedID,
                date_issued: selectedRowIssuedDate,
                rowData: collectionCheckRowData,
                currencyRate,
                transactionNumber,
              })
              .then((res) => {
                if (res.status === 200) {
                  setIsVisibleLiabNote(false);
                  swal({
                    title: "Collections Claimed",
                    text: "The collections has been claimed",
                    icon: "success",
                    timer: 2000,
                  }).then(() => {
                    handleCloseModalSubject();

                    fetchCutoff();
                    setRefreshKey((prev) => prev + 1);
                  });
                }
              })
              .catch((error) => {
                if (error.response) {
                  if (error.response.status === 400) {
                    swal({
                      title: "Bad Request",
                      text:
                        error.response.data.message ||
                        "Invalid input or collections not found.",
                      icon: "error",
                      timer: 2000,
                    });
                  } else if (error.response.status === 404) {
                    swal({
                      title: "Collections Not Found",
                      text: "The collections you are trying to claim does not exist.",
                      icon: "error",
                      timer: 2000,
                    });
                  } else if (error.response.status == 409) {
                    swal({
                      title: "Oopps!",
                      text: "Action is prohibited as the Issued date has already been posted",
                      icon: "error",
                      button: true,
                    });
                  } else {
                    swal({
                      title: "Something went wrong",
                      text: "Please contact your support immediately",
                      icon: "error",
                      timer: 2000,
                    });
                  }
                } else {
                  swal({
                    title: "Something went wrong",
                    text: "Please contact your support immediately",
                    icon: "error",
                    timer: 2000,
                  });
                }
              });
          } else {
            await axios
              .post(BASE_URL + "/outstanding/claim/with-check", {
                subject1,
                subject3: subject3?.value,
                id: selectedRowId,
                selectedBulkCollectionId,
                userLoggedID,
                date_issued: selectedRowIssuedDate,
                rowData: collectionCheckRowData,
                // prettier-ignore
                salesJournal: {
                  customerId: collectionCheckRowData.bulk_collection.customer_id,
                  totalAmount: collectionCheckRowData.amount,
                  currencyName: collectionCheckRowData.bulk_collection.currency.currency_name,
                  currencyRate: collectionCheckRowData.bulk_collection.currency.currency_rate
                },
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    title: "Collections Claimed",
                    text: "The collections has been claimed",
                    icon: "success",
                    timer: 2000,
                  }).then(() => {
                    handleCloseModalSubject();

                    fetchCutoff();
                    setRefreshKey((prev) => prev + 1);
                  });
                }
              })
              .catch((error) => {
                if (error.response) {
                  if (error.response.status === 400) {
                    swal({
                      title: "Bad Request",
                      text:
                        error.response.data.message ||
                        "Invalid input or collections not found.",
                      icon: "error",
                      timer: 2000,
                    });
                  } else if (error.response.status === 404) {
                    swal({
                      title: "Collections Not Found",
                      text: "The collections you are trying to claim does not exist.",
                      icon: "error",
                      timer: 2000,
                    });
                  } else if (error.response.status == 409) {
                    swal({
                      title: "Oopps!",
                      text: "Action is prohibited as the Issued date has already been posted",
                      icon: "error",
                      button: true,
                    });
                  } else {
                    swal({
                      title: "Something went wrong",
                      text: "Please contact your support immediately",
                      icon: "error",
                      timer: 2000,
                    });
                  }
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
    }
  };

  const handleDeleteCollection = async (collectionId, collectionDateIssued) => {
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
            `${BASE_URL}/outstanding/deleteCollection/${collectionId}/${collectionDateIssued}`,
            {
              data: {
                userLoggedID,
              },
            }
          );
          if (response.status === 200) {
            swal({
              title: "Collection Deleted Successfully!",
              text: "The collection has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              fetchCutoff();
            });
          } else if (response.status === 202) {
            const { dateIssued, CutoffName } = response.data;
            swal({
              title: "Delete Prohibited!",
              text: `Collection cannot be deleted as its date issued (${dateIssued}) falls within the posted cutoff period named "${CutoffName}".`,
              icon: "warning",
              button: "OK",
            });
          } else if (response.status === 203) {
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact our support team for assistance.",
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
            text: "An error occurred while deleting the collection.",
          });
        }
      }
    });
  };

  const columns = [
    {
      name: "Transaction No.",
      selector: (row) =>
        row.bulk_collection
          ? row.bulk_collection?.transaction_number
          : row.loan_mothers[0]?.transaction_number ?? "--", // Accessing the first loan_mother's transaction_number
    },
    {
      name: "Transaction Date",
      selector: (row) =>
        (row.bulk_collection?.collection_date &&
          format(
            new Date(row.bulk_collection.collection_date),
            "MMM/dd/yyyy"
          )) ||
        (row.loan_mothers?.[0]?.transaction_date &&
          format(
            new Date(row.loan_mothers[0].transaction_date),
            "MMM/dd/yyyy"
          )) ||
        (row.receiving_checks?.[0]?.transaction_date &&
          format(
            new Date(row.receiving_checks[0].transaction_date),
            "MMM/dd/yyyy"
          )),
    },
    {
      name: "Issued To",
      selector: (row) =>
        row.account_list_sub3_id
          ? ` ${row.account_list_sub3?.account_name} (${row.account_list_sub3?.account_list_base_sub?.subject_name})`
          : "--",
    },
    {
      name: "Issued Date",
      selector: (row) => format(row.date_issued, "MMM/dd/yyyy"),
    },
    {
      name: "Payment Method",
      selector: (row) => row.payment_type,
    },
    {
      name: "Check Number",
      selector: (row) => row.check_number || "---",
    },
    {
      name: "Reference Number",
      selector: (row) => row.ref_number || "---",
    },
    {
      name: "Amount",
      selector: (row) =>
        row.amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0.00",
    },
    {
      name: "Status",
      cell: (row) => {
        const currentDate = new Date();
        const dateIssued = new Date(row.date_issued);

        // Compare current date with the date_issued
        const isDateValid = currentDate >= dateIssued;

        return (
          <div className="d-flex">
            {row.status === "Claimed" ? (
              <div style={{ color: "green", fontWeight: "bold" }}>
                Collected
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (row.isFromLoan) {
                      handleClaimLoan(
                        row.id,
                        row.amount,
                        row.check_number,
                        row.loan_mothers[0]?.remarks,
                        row.loan_mothers[0]?.transaction_number,
                        row.loan_mothers[0]?.currency_id,
                        // row.account_list_sub3?.account_name,
                        // row.account_list_sub3.account_list_base_sub.subject_name,
                        row.account_list_sub3_id,
                        row.date_issued,
                        row.loan_mothers[0]?.loan_name,
                        row.loan_mothers[0]?.currency.currency_name,
                        row
                      );
                    } else {
                      if (row.check_or_online === "Check") {
                        if (row.bulk_collection?.id == null) {
                          const receiveCheck = row.receiving_checks[0];

                          handleModalSubject(
                            row?.id,
                            receiveCheck.currency_id,
                            row.bulk_collection?.id,
                            row.bulk_collection?.transaction_number,
                            row?.date_issued,
                            row
                          );
                        } else {
                          handleModalSubject(
                            row?.id,
                            row.bulk_collection?.currency_id,
                            row.bulk_collection?.id,
                            row.bulk_collection?.transaction_number,
                            row?.date_issued,
                            row
                          );
                        }
                      } else {
                        handleClaim(
                          row.id,
                          row?.bulk_collection?.id,
                          row.date_issued,
                          row
                        );
                      }
                    }
                  }}
                  className={`btn btn-primary ${
                    row.status !== "Approved" || !isDateValid ? "disabled" : ""
                  }`}
                  disabled={row.status !== "Approved" || !isDateValid}
                  style={{
                    cursor:
                      row.status !== "Approved" || !isDateValid
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {row.account_list_sub3_id === null && row.isFromLoan === false
                    ? "Select Account"
                    : "Collect"}
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];
  if (authrztn.includes("OutstandingCheck-Delete")) {
    columns.push({
      name: "Action",
      selector: (row) => (
        <>
          <i
            className="fas fa-trash"
            style={{
              cursor: "pointer",
              color: "red",
              fontSize: "1.5rem",
              opacity: row?.receiving_checks?.length != 0 ? 1 : 0.5,
            }}
            onClick={() => {
              if (row?.receiving_checks?.length != 0) {
                handleDeleteCollection(row.id, row.date_issued);
                return;
              }

              const wrapper = document.createElement("div");
              wrapper.classList.add("center-swal-text");
              wrapper.innerHTML =
                "To delete this transaction, please delete it first from Local or Overseas Collection.";
              swal({
                icon: "warning",
                title: "Warning",
                content: wrapper,
                button: "OK",
              });
              return;
            }}
          ></i>
        </>
      ),
    });
  }

  const conditionalRowStyles = [
    {
      when: (row) => row.status === "Not Deposit",
      style: {
        borderLeft: "4px solid blue",
      },
    },
  ];

  const handleSubject1Change = (event) => {
    const selectedSubject1 = event.target.value;
    let account_selected = "";

    if (selectedSubject1 === "Account-List") {
      setIsVisibleLiabNote(false);
      account_selected = "Account-List";
    } else if (selectedSubject1 === "Asset Account") {
      setIsVisibleLiabNote(false);
      account_selected = "Asset Account";
    } else if (selectedSubject1 === "Liabilities Account") {
      setIsVisibleLiabNote(true);
      account_selected = "Liabilities Account";
    } else if (selectedSubject1 === "Owner's Equity Account") {
      setIsVisibleLiabNote(false);
      account_selected = "Owner's Equity Account";
    }

    try {
      axios
        .get(`${BASE_URL}/outstanding/getSubject2`, {
          params: {
            account_selected: account_selected,
          },
        })
        .then((res) => {
          setSubject1(selectedSubject1);
          setSubject2DataList(res.data);
          setIsSubject2Disabled(false);
        });
    } catch (error) {
      console.log(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
      });
    }
  };

  // Update Subject 3 based on Subject 2 selection
  const handleSubject2Change = (selectedOption) => {
    const selectedSubject2 = selectedOption;
    console.log("Curr ID", currencySelectedId);
    console.log("Selected Subjj", selectedSubject2);
    try {
      axios
        .get(`${BASE_URL}/outstanding/getSubject3ChainDropdown`, {
          params: {
            subjectId: selectedSubject2?.value,
            currencyId: currencySelectedId,
          },
        })
        .then((res) => {
          setSubject3DataList(res.data);
          setSubject2(selectedSubject2);
          setIsSubject3Disabled(false);
        });
    } catch (error) {
      console.log(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
      });
    }
  };

  const handleSubject3Change = (selectedOption) => {
    const selectedSubject3 = selectedOption;
    setSubject3(selectedSubject3);
  };

  // search
  // const filteredItems = localData.filter((item) => {
  //   if (!searchText) return true;

  //   const searchLower = searchText.toLowerCase();
  //   // const contactPerson = `${item.fname} ${item.lname}`.toLowerCase(); // Concatenate and convert to lower case

  //   switch (filterColumn) {
  //     case "date":
  //       return item.date.toLowerCase().includes(searchLower);
  //     case "transac_no":
  //       return item.transac_no.toLowerCase().includes(searchLower);
  //     case "bank_name":
  //       return item.bank_name.toLowerCase().includes(searchLower);
  //     case "description":
  //       return item.description.toLowerCase().includes(searchLower);
  //     case "account_name":
  //       return item.account_name.toLowerCase().includes(searchLower);
  //     case "amount":
  //       return item.amount.toLowerCase().includes(searchLower);
  //     case "status":
  //       return item.status.toLowerCase().includes(searchLower);
  //     default:
  //       return (
  //         item.date.toLowerCase().includes(searchLower) ||
  //         item.transac_no.toLowerCase().includes(searchLower) ||
  //         item.bank_name.toLowerCase().includes(searchLower) ||
  //         item.description.toLowerCase().includes(searchLower) ||
  //         item.account_name.toLowerCase().includes(searchLower) ||
  //         item.amount.toLowerCase().includes(searchLower) ||
  //         item.status.toLowerCase().includes(searchLower)
  //       );
  //   }
  // });

  // For Receiving Check
  const fetchSubject2Data = (value) => {
    try {
      axios
        .get(BASE_URL + "/accountListSub/getSubject", {
          params: {
            account_selected: value,
          },
        })
        .then((res) => {
          // console.log(res.data);
          setSubject2LoanDataList(res.data);
        });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubject3Data = (value) => {
    try {
      axios
        .get(BASE_URL + "/accountListSub/getSubject3", {
          params: { subjectId: value },
        })
        .then((res) => {
          setSubject3LoanDataList(res.data);
          console.log(res.data);
        });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCurrencyList = () => {
    try {
      axios.get(BASE_URL + "/currency/fetchCurrency").then((res) => {
        setCurrencyList(res.data);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLoanAmount = (e) => {
    let value = e.target.value;

    if (value == ".") {
      setLoanData((prev) => ({
        ...prev,
        amount: prev.amount + ".",
      }));
    }

    let inputValue = value.replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    const cleanedValue = formattedValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma

    setLoanData({
      ...loanData,
      amount: cleanedValue,
    });
  };

  const handleSubmitReceivingCheck = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please Fill in all required fields.",
        button: "OK",
      });
    } else {
      try {
        const confirmation = await swal({
          icon: "warning",
          title: "Are you sure?",
          text: "Once you submit, you will not be able to undo this action.",
          buttons: true,
        });

        // Get the currency rate
        const currencyRate = currencyList.find(
          (c) => c.id === loanData.currency_id
        ).currency_rate;

        const cleanedLoanData = {
          ...loanData,
          subject2: loanData.subject2?.value,
          subject3: loanData.subject3?.value,
        };

        const formatLoanData = {
          ...cleanedLoanData,
          userLoggedID,
          amount: parseFloat(loanData.amount.replace(/,/g, "")),
          currency_rate: currencyRate,
        };

        if (confirmation) {
          try {
            const res = await axios.post(
              `${BASE_URL}/outstanding/addReceivingCheck`,
              formatLoanData
            );
            if (res.status === 201) {
              swal({
                icon: "success",
                title: "Receving Check Successful",
                text: "Receiving Check has been added.",
                timer: 2000,
              }).then(() => {
                const [filteredCutoff] = cutOffs.filter((item) => {
                  return item.id == selectedCutOff?.id;
                });
                handleCloseReceivingCheckModal();
                fetchCollectionsData(filteredCutoff);
                fetchCutoff();
              });
            }
          } catch (error) {
            console.error(error);
            swal({
              icon: "error",
              title: "Something Went Wrong.",
              text: "Please Contact your support immediately.",
              button: "OK",
            });
          }
        }
      } catch (error) {
        console.error(error);
        swal({
          icon: "error",
          title: "Something Went Wrong.",
          text: "Please Contact your support immediately.",
          button: "OK",
        });
      }
      setValidated(false);
    }
  };

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
  };

  // Export function for PDF
  const exportToPdf = () => {
    swal({
      icon: "warning",
      title: "Export to PDF?",
      text: "Do you want to export this data as a PDF file?",
      dangerMode: true,
      buttons: true,
    }).then((confirm) => {
      if (confirm) setPrintToPdf(true);
    });
  };

  // Export function for CSV
  const exportToCsv = () => {
    swal({
      icon: "warning",
      title: "Export to CSV?",
      text: "Do you want to export this data as a CSV file?",
      dangerMode: true,
      buttons: true,
    }).then((confirm) => {
      if (confirm) csvLinkRef.current.link.click();
    });
  };

  // Props for Export PDF/CSV
  const cutoffName = handleCutoffChange(selectedCutOff?.id)?.name;
  const props = {
    accountName: selectedAccount.current?.label ?? "All Account",
    accountId: selectedAccount.current?.value,
    cutoffName: cutoffName ?? "All",
    dateFrom: cutOffDate?.from,
    dateTo: cutOffDate?.to,
    searchText,
    filterColumn,
  };

  // Account Options for dropdown select
  const accountOptions = accountListSub3.map((item) => ({
    value: item.id,
    label: `${item.account_list_base_sub.subject_name} - ${item.account_name}`,
  }));

  // Subject 2 Options for dropdown select
  const subject2Options = subject2DataList.map((item) => ({
    value: item.id,
    label: item.subject_name,
    subject_type: item.subject_type,
  }));

  // Subject 3 Options for dropdown select
  const subject3Options = subject3DataList.map((item) => ({
    value: item.id,
    label: item.account_name,
  }));

  // Receiving Check Modal Subject 2 Options for dropdown select
  const subject2LoanOptions = subject2LoanDataList.map((item) => ({
    value: item.id,
    label: item.subject_name,
  }));

  // Receiving Check Modal Subject 3 Options for dropdown select
  const subject3LoanOptions = subject3LoanDataList
    .filter((option) => option.currency_id === loanData.currency_id)
    .map((item) => ({
      value: item.id,
      label: item.account_name,
    }));

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, generateYears }, ref) => (
      <input
        type="text"
        className="form-control w-100"
        style={{
          cursor: "pointer",
          caretColor: "transparent",
        }}
        onClick={() => {
          onClick();

          const date = new Date(value).getFullYear();

          generateYears(date); // Reset/Initialize Year List based on selected date of birth
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required
      />
    )
  );

  useEffect(() => {
    const { data, totalClaimed, totalUnclaimed } = pagination.data;
    setWidget((prev) => ({
      ...prev,
      totalClaimed: totalClaimed,
      totalUnclaimed: totalUnclaimed,
    }));
    setCollectionsData(data);
  }, [pagination.data]);

  useEffect(() => {
    setSearchText("");
    fetchCutoff();
  }, [filterColumn]);

  useEffect(() => {
    fetchAccountListSub3ForSelect();
    fetchCurrencyList();
    fetchSubject2Data("Liabilities Account");
  }, []);

  useEffect(() => {
    fetchCutoff();
  }, [searchText]);

  useEffect(() => {
    if (selectedAccount.current && filterColumn == "issued_to") {
      setFilterColumn("all");
    }
  }, [selectedAccount.current]);

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
    selectedAccount.current = "";
    fetchCollectionsData(cutoff);
  };

  // Calculate tab counts using useMemo to prevent unnecessary recalculations
  const pendingCount = useMemo(
    () => collectionsData?.filter((d) => d.status === "Approved").length || 0,
    [collectionsData]
  );

  const collectedCount = useMemo(
    () => collectionsData?.filter((d) => d.status === "Claimed").length || 0,
    [collectionsData]
  );

  // Filter data based on active tab
  const [activeTab, setActiveTab] = useState("pending");

  const tabFilteredData = useMemo(() => {
    return collectionsData?.filter((data) =>
      activeTab === "pending"
        ? data.status === "Approved"
        : data.status === "Claimed"
    );
  }, [collectionsData, activeTab]);

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
      ) : authrztn.includes("OutstandingCheck-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">
                Outstanding Receivable
              </span>
            </div>

            <div className="d-flex flex-row">
              {/* {authrztn.includes("OutstandingCheck-Add") && (
                <Button
                  variant="outline-success"
                  onClick={() => {
                    setShowAddLoanModal(true);
                  }}
                >
                  <i className="fa-solid fa-plus me-1"></i> Add Loan
                </Button>
              )} */}
              <CollectionCsv
                {...props}
                csvLinkRef={csvLinkRef}
                refreshKey={refreshKey}
              />
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-success dropdown-toggle me-2"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Export
                </button>
                <ul className="dropdown-menu">
                  <li
                    className="dropdown-item border-bottom"
                    style={{ cursor: "pointer" }}
                    onClick={() => exportToPdf()}
                  >
                    PDF
                  </li>
                  <li
                    className="dropdown-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => exportToCsv()}
                  >
                    CSV
                  </li>
                </ul>
              </div>
              {authrztn.includes("OutstandingCheck-Add") && (
                <Button
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                  onClick={() => {
                    setShowReceivingCheckModal(true);
                  }}
                >
                  <i className="bx bx-plus fs-5"></i> Receiving Check
                </Button>
              )}
            </div>
          </div>
          <div className="container-fluid mt-4 p-0">
            <div
              className="container"
              style={{ paddingRight: "150px", paddingLeft: "150px" }}
            >
              <div className="row mx-auto">
                <div className="col-sm w-100 p-3 payable-card">
                  <div className="w-100 border p-3 shadow-sm rounded h-100">
                    <div className=" d-flex flex-row align-items-center payable-icon">
                      <i class="bx bxs-discount fs-3 h-100"></i>
                      <h3>Total Claimed</h3>
                    </div>

                    <div className=" mt-2 d-flex flex-column payable-card-desc">
                      <p
                        style={{
                          color: "orange",
                          fontSize: "2.5rem",
                          cursor: "default",
                        }}
                        title={widget.totalClaimed?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      >
                        {widget.totalClaimed?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) || 0.0}
                        {/* {widget.totalClaimed
                          ? compactNumberFormat(widget.totalClaimed)
                          : "0.00"} */}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-sm w-100 p-3 payable-card">
                  <div className="w-100 border p-3 shadow-sm rounded h-100">
                    <div className=" d-flex flex-row align-items-center payable-icon">
                      <i class="bx bx-money-withdraw fs-3 h-100"></i>
                      <h3>Total Unclaimed</h3>
                    </div>

                    <div className=" mt-2 d-flex flex-column payable-card-desc">
                      <p
                        style={{
                          color: "green",
                          fontSize: "2.5rem",
                          cursor: "default",
                        }}
                        title={widget.totalUnclaimed?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      >
                        {widget.totalUnclaimed?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) || 0.0}
                        {/* {widget.totalUnclaimed
                          ? compactNumberFormat(widget.totalUnclaimed)
                          : "0.00"} */}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-100 row mx-0 mt-3">
            <div className="col-sm mb-2">
              <label htmlFor="">Account</label>
              {/* <select
                value={selectedAccount.current}
                onChange={handleSelectAccount}
                className="form-select"
                onMouseDown={(e) => {
                  if (accountListSub3.length === 0) {
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
                {accountListSub3?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.account_list_base_sub.subject_name} -{" "}
                    {item.account_name}
                  </option>
                ))}
              </select> */}
              <Select
                options={accountOptions}
                value={selectedAccount.current}
                onChange={handleSelectAccount}
                onMenuOpen={() => {
                  if (accountListSub3.length === 0) {
                    swal({
                      icon: "warning",
                      title: "No Account Found",
                      text: "No account found. Please add an account first",
                    });
                    return;
                  }
                }}
                menuIsOpen={accountListSub3.length === 0 ? false : undefined}
                placeholder={`All Account`}
                styles={selectCustomStyles(selectedAccount.current)}
                isSearchable
                isClearable
              />
            </div>
            <div className="col-sm mb-2">
              <DateRangePicker
                startDate={cutOffDate?.from ? new Date(cutOffDate.from) : null}
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
            {/* <div className="col-sm mb-2">
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
            <div className="col-sm mb-2">
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
            <div className="col-sm mb-2 d-flex flex-row align-items-end filter-btn-container">
              {/* <button className="btn">Apply Filter</button>
              <button className="btn btn-secondary" onClick={clearFilter}>
                Clear Filter
              </button> */}
            </div>
          </div>
          {/* <div className="w-100 d-flex flex-row justify-content-between">
            <div className="w-100"></div>
            <div className="d-flex justify-content-end align-items-center my-3">
              <button
                className="btn btn-outline-success me-2 fs-6"
                // onClick={handleExport}
              >
                <i className="fa-solid fa-download me-1"></i> Export
              </button>
              <button className="btn btn-outline-danger fs-6">
                <i className="fa-solid fa-upload me-1"></i> Import
              </button>
            </div>
          </div> */}
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
                      filterColumn === "transaction_number" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("transaction_number")}
                  >
                    Transaction No.
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
                      filterColumn === "issued_to" ? "active" : ""
                    }`}
                    onClick={() => {
                      setFilterColumn("issued_to");
                      selectedAccount.current = "";
                    }}
                  >
                    Issued To
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
                      filterColumn === "payment_method" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("payment_method")}
                  >
                    Payment Method
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
                      filterColumn === "ref_number" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("ref_number")}
                  >
                    Reference Number
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
              </ul>
            </div>
          </div>
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
              id="collection-status-tabs"
              className="mb-3"
            >
              <Tab eventKey="pending" title={`Pending (${pendingCount})`}>
                <div className="data-table-cell-width">
                  <DataTable
                    columns={columns}
                    data={tabFilteredData}
                    customStyles={customStyles}
                    conditionalRowStyles={conditionalRowStyles}
                    className="dataTable"
                  />
                  <PaginationControls {...pagination} />
                </div>
              </Tab>

              <Tab eventKey="collected" title={`Collected (${collectedCount})`}>
                <div className="data-table-cell-width">
                  <DataTable
                    columns={columns}
                    data={tabFilteredData}
                    customStyles={customStyles}
                    conditionalRowStyles={conditionalRowStyles}
                    className="dataTable"
                  />
                  <PaginationControls {...pagination} />
                </div>
              </Tab>
            </Tabs>
          </div>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}

      {/* Subject modal for claiming */}
      <Modal
        show={modalSubject}
        onHide={handleCloseModalSubject}
        backdrop="static"
        size="md"
      >
        <Form
          noValidate
          validated={validated}
          onSubmit={(e) => handleClaimSubject(e, "Debit")}
        >
          <Modal.Header closeButton>
            <Modal.Title className="text-primary fw-bold">
              Claiming{" "}
              {transactionNumber
                ? `(${transactionNumber})`
                : `Check #: ${issuedCheckNumber}`}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4">
            {/* <Table bordered>
              <thead>
                <tr>
                  <th>Subject 1</th>
                  <th>Subject 2</th>
                  <th>Subject 3</th>
                  {isNotPhp && <th>Foreign Rate</th>}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "15px" }} className="w-25">
                    <select
                      className="form-select text-truncate"
                      onChange={handleSubject1Change}
                      value={subject1}
                      required
                    >
                      <option value="" selected disabled>
                        Select Account
                      </option>
                      <option value="Account-List">Account-List</option>
                      <option value="Asset Account">Asset Account</option>
                      <option value="Liabilities Account">
                        Liabilities Account
                      </option>
                      <option value="Owner's Equity Account">
                        Owner's Equity Account
                      </option>
                    </select>
                  </td>
                  <td style={{ padding: "15px" }} className="w-25">
                    <select
                      className="form-select"
                      onChange={(e) =>
                        handleSubject2Change(
                          e,
                          e.target.options[e.target.selectedIndex].getAttribute(
                            "data-subject-type"
                          )
                        )
                      }
                      value={subject2}
                      disabled={isSubject2Disabled}
                      required
                    >
                      <option value="" selected>
                        Select Subject 2
                      </option>
                      {subject2DataList.map((option) => (
                        <option
                          key={option.id}
                          value={option.id}
                          data-subject-type={option.subject_type}
                        >
                          {option.subject_name}
                        </option>
                      ))}
                    </select>
                    <Select
                      options={subject2Options}
                      value={subject2}
                      onChange={(selectedOption) =>
                        handleSubject2Change(selectedOption)
                      }
                      placeholder={`Select Subject 2`}
                      styles={selectCustomStyles(subject2, validated)}
                      isDisabled={isSubject2Disabled}
                      required
                      isSearchable
                    />
                  </td>
                  <td style={{ padding: "15px" }} className="w-25">
                    <select
                      className="form-select"
                      onChange={handleSubject3Change}
                      value={subject3}
                      disabled={isSubject3Disabled}
                      required
                    >
                      <option value="" selected>
                        Select Subject 3
                      </option>
                      {subject3DataList.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.account_name}
                        </option>
                      ))}
                    </select>
                    <Select
                      options={subject3Options}
                      value={subject3}
                      onChange={handleSubject3Change}
                      placeholder={`Select Subject 3`}
                      styles={selectCustomStyles(subject3, validated)}
                      isDisabled={isSubject3Disabled}
                      required
                      isSearchable
                    />
                  </td>
                  {isNotPhp && (
                    <td style={{ padding: "15px " }}>
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
                    </td>
                  )}
                </tr>
              </tbody>
            </Table> */}
            <div className="mb-3">
              <label htmlFor="subject1-claim" className="fw-semibold">
                Subject 1 <span style={{ color: "red" }}>*</span>{" "}
                {isVisibleLiabNote && (
                  <span
                    className="fst-italic text-danger "
                    style={{ fontSize: 9.5 }}
                  >
                    (Please be advised that this liability will result in a
                    deduction from the selected account upon collection)
                  </span>
                )}
              </label>
              <select
                className="form-select text-truncate"
                onChange={handleSubject1Change}
                value={subject1}
                id="subject1-claim"
                required
              >
                <option value="" selected disabled>
                  Select Account
                </option>
                <option value="Account-List">Account-List</option>
                <option value="Asset Account">Asset Account</option>
                {isFromSalesCollection && (
                  <option value="Liabilities Account">
                    Liabilities Account
                  </option>
                )}
                <option value="Owner's Equity Account">
                  Owner's Equity Account
                </option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="subject2-claim" className="fw-semibold">
                Subject 2 <span style={{ color: "red" }}>*</span>{" "}
              </label>
              <Select
                options={subject2Options}
                value={subject2}
                id="subject2-claim"
                onChange={(selectedOption) =>
                  handleSubject2Change(selectedOption)
                }
                placeholder={`Select Subject 2`}
                styles={selectCustomStyles(subject2, validated)}
                isDisabled={isSubject2Disabled}
                required
                isSearchable
              />
            </div>

            <div className="mb-3">
              <label htmlFor="subject3-claim" className="fw-semibold">
                Subject 3 <span style={{ color: "red" }}>*</span>{" "}
              </label>
              <Select
                options={subject3Options}
                value={subject3}
                id="subject3-claim"
                onChange={handleSubject3Change}
                placeholder={`Select Subject 3`}
                styles={selectCustomStyles(subject3, validated)}
                isDisabled={isSubject3Disabled}
                required
                isSearchable
              />
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModalSubject}
            >
              Close
            </Button>
            <Button variant="primary" type="submit">
              Claim
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Confirmation export Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Confirm Export</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          Are you sure you want to export the data?
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancel
          </Button>
          <CSVLink
            // data={exportToCSV()}
            filename={"export.csv"}
            className="btn btn-primary"
            asyncOnClick={true}
            onClick={(event, done) => {
              setShowConfirmModal(false);
              done();
            }}
          >
            Export
          </CSVLink>
        </Modal.Footer>
      </Modal>

      {/* PDF Modal */}
      <Modal show={printToPdf} size="xl" onHide={() => setPrintToPdf(false)}>
        <div className="position-relative">
          <PDFDownloadLink
            document={<CollectionPdf {...props} />}
            fileName={`Outstanding Receivable.pdf`}
          >
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip
                  id="tooltip-right"
                  className="me-2"
                  style={{ fontSize: "0.8rem" }}
                >
                  Download as{" "}
                  <strong className="text-danger">
                    Outstanding Receivable
                  </strong>
                </Tooltip>
              }
              delay={300}
            >
              <Button
                variant="light"
                className="position-absolute btn btn-light border border-4 border-secondary mb-5 rounded-5"
                style={{ bottom: "7rem", left: "2rem" }}
              >
                <i class="fa-solid fa-download"></i>
              </Button>
            </OverlayTrigger>
          </PDFDownloadLink>
          <PDFViewer style={{ width: "100%", height: "100vh" }}>
            <CollectionPdf {...props} />
          </PDFViewer>
        </div>
      </Modal>

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
            onClick={handleSubmitForeignRateModal}
          >
            Submit
          </button>
        </Modal.Footer>
      </Modal>

      {/* Receiving Check Modal */}
      <Modal
        show={showReceivingCheckModal}
        onHide={handleCloseReceivingCheckModal}
        backdrop="static"
        size="lg"
      >
        <Form
          noValidate
          validated={validated}
          onSubmit={(e) => handleSubmitReceivingCheck(e)}
        >
          <Modal.Header closeButton>
            <Modal.Title className="text-primary fw-bold">
              Receiving Check
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="w-100 px-2 py-0">
              <div className="card border-0">
                <div className="card-body">
                  {/* Transaction Date Field */}
                  <div className="row mb-3">
                    <div className="col-lg">
                      <label htmlFor="transactionDate" className="fw-semibold">
                        Transaction Date
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fa-solid fa-calendar-alt"></i>
                        </span>
                        {/* <Form.Control
                          type="date"
                          id="transactionDate"
                          value={loanData.transactionDate}
                          required
                          onChange={(e) =>
                            setLoanData({
                              ...loanData,
                              transactionDate: e.target.value,
                            })
                          }
                          className="rounded"
                        /> */}
                        {/* <div className="flex-grow-1">
                          <DatePicker
                            selected={loanData.transactionDate}
                            onChange={(date) => {
                              dateValidation(
                                date,
                                setLoanData,
                                "Transaction Date",
                                "transactionDate"
                              );
                              setLoanData({
                                ...loanData,
                                transactionDate: date,
                              });
                            }}
                            dateFormat="MMM/dd/yyyy"
                            customInput={<CustomInput />}
                          />
                        </div> */}
                        <CustomDatePicker
                          label={"Transaction Date"}
                          field={"transactionDate"}
                          selected={
                            loanData.transactionDate
                              ? new Date(loanData.transactionDate)
                              : ""
                          }
                          handleDateChange={(date) => {
                            dateValidation(
                              date,
                              setLoanData,
                              "Transaction Date",
                              "transactionDate"
                            );
                            setLoanData({
                              ...loanData,
                              transactionDate: date,
                            });
                          }}
                          setter={setLoanData}
                          CustomInput={CustomInput}
                          isRequired={true}
                          validated={validated}
                          dateValidation={dateValidation}
                          iconTopOffset={"0.7rem"}
                        />
                      </div>
                    </div>

                    <div className="col-lg mt-3 mt-lg-0">
                      <label htmlFor="issuedDate" className="fw-semibold">
                        Issued Date
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fa-solid fa-calendar-alt"></i>
                        </span>
                        {/* <Form.Control
                          type="date"
                          id="issuedDate"
                          value={loanData.issuedDate}
                          required
                          onChange={(e) =>
                            setLoanData({
                              ...loanData,
                              issuedDate: e.target.value,
                            })
                          }
                          className="rounded"
                        /> */}
                        {/* <div className="flex-grow-1">
                          <DatePicker
                            selected={loanData.issuedDate}
                            onChange={(date) => {
                              dateValidation(
                                date,
                                setLoanData,
                                "Issued Date",
                                "issuedDate"
                              );
                              setLoanData({
                                ...loanData,
                                issuedDate: date,
                              });
                            }}
                            dateFormat="MMM/dd/yyyy"
                            customInput={<CustomInput />}
                          />
                        </div> */}
                        <CustomDatePicker
                          label={"Issued Date"}
                          field={"issuedDate"}
                          selected={
                            loanData.issuedDate
                              ? new Date(loanData.issuedDate)
                              : ""
                          }
                          handleDateChange={(date) => {
                            dateValidation(
                              date,
                              setLoanData,
                              "Issued Date",
                              "issuedDate"
                            );
                            setLoanData({
                              ...loanData,
                              issuedDate: date,
                            });
                          }}
                          setter={setLoanData}
                          CustomInput={CustomInput}
                          isRequired={true}
                          validated={validated}
                          dateValidation={dateValidation}
                          iconTopOffset={"0.7rem"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Currency Field */}
                  <div className="row mb-3">
                    <div className="col-sm">
                      <label htmlFor="currency" className="fw-semibold">
                        Currency
                      </label>
                      <Form.Select
                        value={loanData.currency_id}
                        required
                        onChange={(e) =>
                          setLoanData({
                            ...loanData,
                            subject2: "",
                            subject3: "",
                            currency_id: e.target.value,
                            currency_name:
                              e.target.options[e.target.selectedIndex].text,
                          })
                        }
                      >
                        <option value="" selected disabled>
                          Select Currency
                        </option>
                        {currencyList.map((currency) => (
                          <option key={currency.id} value={currency.id}>
                            {currency.currency_name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                    <div className="col-sm mt-3 mt-sm-0">
                      <label htmlFor="checkNumber" className="fw-semibold">
                        Check Number
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fa-solid fa-file-invoice"></i>
                        </span>
                        <Form.Control
                          type="text"
                          id="checkNumber"
                          value={loanData.checkNumber}
                          required
                          onChange={(e) =>
                            setLoanData({
                              ...loanData,
                              checkNumber: e.target.value,
                            })
                          }
                          placeholder="Enter check number"
                          className="rounded z-0"
                          maxLength={15}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subject Fields  */}
                  <div className="row mb-3">
                    <div className="col-sm">
                      <label htmlFor="subject1" className="fw-semibold">
                        Subject 1 (For Loan)
                      </label>
                      <Form.Select
                        id="subject1"
                        value={loanData.subject1}
                        disabled={loanData.currency_id === ""}
                        required
                        onChange={(e) => {
                          setLoanData({
                            ...loanData,
                            subject1: e.target.value,
                            subject2: "",
                            subject3: "",
                          });
                          fetchSubject2Data(e.target.value);
                        }}
                        className="rounded"
                      >
                        <option value="" disabled>
                          Select Subject 1
                        </option>
                        <option value="Owner's Equity Account" disabled>
                          Owner's Equity Account
                        </option>
                        <option value="Account-List" disabled>
                          Account-List
                        </option>
                        <option value="Asset Account" disabled>
                          Asset Account
                        </option>
                        <option value="Liabilities Account">
                          Liabilities Account
                        </option>
                      </Form.Select>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm">
                      <label htmlFor="subject2" className="fw-semibold">
                        Subject 2
                      </label>
                      {/* <Form.Select
                        id="subject2"
                        value={loanData.subject2}
                        disabled={loanData.currency_id === ""}
                        required
                        onChange={(e) => {
                          setLoanData({
                            ...loanData,
                            subject2: e.target.value,
                            subject3: "",
                            subject2_name:
                              e.target.options[e.target.selectedIndex].text,
                          });
                          fetchSubject3Data(e.target.value);
                        }}
                        className="rounded"
                      >
                        <option value="" disabled>
                          Select Subject 2
                        </option>
                        {subject2LoanDataList.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.subject_name}
                          </option>
                        ))}
                      </Form.Select> */}
                      <Select
                        options={subject2LoanOptions}
                        value={loanData.subject2}
                        onChange={(selectedOption) => {
                          setLoanData({
                            ...loanData,
                            subject2: selectedOption,
                            subject3: "",
                            subject2_name: selectedOption?.label,
                            // e.target.options[e.target.selectedIndex].text,
                          });
                          fetchSubject3Data(selectedOption?.value);
                        }}
                        placeholder={`Select Subject 2`}
                        styles={selectCustomStyles(
                          loanData.subject2,
                          validated
                        )}
                        isDisabled={loanData.currency_id === ""}
                        required
                        isSearchable
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-sm">
                      <label htmlFor="subject3" className="fw-semibold">
                        Subject 3
                      </label>
                      {/* <Form.Select
                        id="subject3"
                        value={loanData.subject3}
                        disabled={
                          loanData.currency_id === "" ||
                          loanData.subject2 === ""
                        }
                        required
                        onChange={(e) =>
                          setLoanData({
                            ...loanData,
                            subject3: e.target.value,
                            subject3_name:
                              e.target.options[e.target.selectedIndex].text,
                          })
                        }
                        className="rounded"
                      >
                        <option value="" disabled>
                          Select Subject 3
                        </option>
                        {subject3LoanDataList
                          .filter(
                            (option) =>
                              option.currency_id === loanData.currency_id
                          )
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.account_name}
                            </option>
                          ))}
                      </Form.Select> */}
                      <Select
                        options={subject3LoanOptions}
                        value={loanData.subject3}
                        onChange={(selectedOption) =>
                          setLoanData({
                            ...loanData,
                            subject3: selectedOption,
                            subject3_name: selectedOption?.label,
                            // e.target.options[e.target.selectedIndex].text,
                          })
                        }
                        onMenuOpen={() => {
                          if (subject3LoanOptions.length === 0) {
                            swal({
                              icon: "warning",
                              title: "No Account Found",
                              text: "There is no account associated with the selected currency. Please create one before proceeding.",
                            });

                            setIsMenuOpen(false);
                          } else {
                            setIsMenuOpen(true);
                          }
                        }}
                        onMenuClose={() => setIsMenuOpen(false)}
                        menuIsOpen={isMenuOpen}
                        placeholder={`Select Subject 3`}
                        styles={selectCustomStyles(
                          loanData.subject2,
                          validated
                        )}
                        isDisabled={
                          loanData.currency_id === "" ||
                          loanData.subject2 === ""
                        }
                        required
                        isSearchable
                      />
                    </div>
                  </div>

                  {/* Amount Field */}
                  <div className="row mb-3">
                    <div className="col-sm">
                      <label htmlFor="amount" className="fw-semibold">
                        Amount
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          {loanData.currency_name}
                        </span>
                        <Form.Control
                          type="text"
                          id="amount"
                          value={loanData.amount}
                          required
                          // onChange={(e) =>
                          //   setLoanData({
                          //     ...loanData,
                          //     amount: e.target.value,
                          //   })
                          // }
                          onChange={handleLoanAmount}
                          placeholder="Enter amount"
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseReceivingCheckModal}
              className="rounded"
            >
              Close
            </Button>
            <Button variant="primary" type="submit" className="rounded">
              Save
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Collection;
