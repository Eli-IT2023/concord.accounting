import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  InputGroup,
  Tab,
  Nav,
  Table,
} from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import swal from "sweetalert";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import { useNavigate } from "react-router-dom";
import { MultiSelect } from "react-multi-select-component";
import NoData from "../../assets/img/no-data.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import NoAccess from "../../assets/img/NoAccess.png";
import Select from "react-select";
import { selectCustomStyles } from "../../assets/global/selectCustomStyles";
import CustomDatePicker from "../../components/CustomDatePicker";

function ReturnEarnings({ authrztn }) {
  const userLoggedID = useDecodeToken();

  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [toUpdateID, setToUpdateID] = useState(null);
  const [earning_name, setEarning_name] = useState("");
  const [validated, setValidated] = useState(false);
  const [earnings, setEarnings] = useState([]);
  const [cutoffData, setCutoffData] = useState([]);
  const [selectedEarnings, setSelectedEarnings] = useState([]);
  const [hasSelectedEarnings, setHasSelectedEarnings] = useState(false);
  const [selectedOptionsCutoff, setSelectedOptionsCutoff] = useState([]);

  const [selectedEarningsNetAmount, setSelectedEarningsNetAmount] = useState(0);

  const [showReturnEarnings, setShowReturnEarnings] = useState(false); /// step1
  const [ownerList, setOwnerList] = useState([]);
  const [showViewReturned, setShowViewReturned] = useState(false);
  const [viewReturnedData, setViewReturnedData] = useState([]);
  const [showViewReturnedDetails, setShowViewReturnedDetails] = useState(false);

  const [floatPayment, setFloatPayment] = useState([]);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [ownerIdToAddFunds, setOwnerIdToAddFunds] = useState(null);
  const [ownerNameToAddFunds, setOwnerNameToAddFunds] = useState("");
  const [ownerToReturnAmount, setOwnerToReturnAmount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState("Bank");

  const [selectedSubject1, setSelectedSubject1] = useState("Account-List");

  const [accountListSub2, setAccountListSub2] = useState([]);
  const [selectedSubject2, setSelectedSubject2] = useState("");

  const [accountListSub3, setAccountListSub3] = useState([]);
  const [selectedSubject3, setSelectedSubject3] = useState("");

  const [datePayment, setDatePayment] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [amountToAddFunds, setAmountToAddFunds] = useState("");
  const [showViewFunds, setShowViewFunds] = useState(false);
  const [searchText, setSearchText] = useState("");

  const handleClose = () => {
    setShowViewReturned(false);
    setShowReturnEarnings(false);
    setShow(false);
    setValidated(false);
    setSelectedOptionsCutoff([]);
    setEarning_name("");
    setShowUpdate(false);
    setShowViewFunds(false);
    setShowAddFunds(false);
    setShowViewReturnedDetails(false);
  };
  const handleShow = () => setShow(true);
  const handleShowUpdate = (earning) => {
    // console.log(`earning`, earning);
    setShowUpdate(true);
    setToUpdateID(earning.id);

    setEarning_name(earning.name);
    setSelectedOptionsCutoff([]);
    // Set selected options based on the earning's return earnings cutoffs
    // Map the cutoffs from the earning's cutoffs array
    const selectedCutoffs = earning.cutoffs.map((cutoff) => ({
      value: cutoff.cutoff_id,
      label: cutoff.cutoff_name,
      from: cutoff.from,
      to: cutoff.to,
    }));

    setSelectedOptionsCutoff(selectedCutoffs);
  };

  const handleViewEarnings = (id) => {
    navigate(`/accounting/view-earnings/${id}`);
  };

  const getEarnings = async () => {
    try {
      await axios
        .get(`${BASE_URL}/earnings/getEarnings`, {
          params: {
            searchText,
          },
        })
        .then((res) => {
          setEarnings(res.data);
          // console.log(res.data, "earnings");
        });
    } catch (error) {
      console.log(error);
    }
  };
  const getCutoffs = async () => {
    try {
      await axios
        .get(`${BASE_URL}/earnings/getCutoffs`)

        .then((res) => {
          setCutoffData(res.data);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const cutoffOptions = cutoffData.map((option) => ({
    value: option.id,
    label: option.name,
    from: option.from,
    to: option.to,
  }));

  const handleChange = (selected) => {
    setSelectedOptionsCutoff(selected);
    // console.log(selected);
  };

  const getAccountListSub2 = async () => {
    await axios
      .get(`${BASE_URL}/accountListSub/getSubject`, {
        params: {
          account_selected: selectedSubject1,
        },
      })
      .then((res) => {
        setAccountListSub2(res.data);
      });
  };

  useEffect(() => {
    getCutoffs();
    getEarnings();
  }, []);

  useEffect(() => {
    getEarnings();
  }, [searchText]);

  const addNew = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      swal({
        title: "Confirm Action",
        text: "Are you sure you want to create a new earnings period?",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          try {
            axios
              .post(`${BASE_URL}/earnings/createEarnings`, {
                selectedOptionsCutoff,
                earning_name,
                userLoggedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    icon: "success",
                    title: "Success",
                    text: "Earnings created successfully",
                    timer: 2000,
                    button: false,
                  }).then(() => {
                    handleClose();
                    getEarnings();
                  });
                } else if (res.status === 201) {
                  swal({
                    icon: "error",
                    title: "Oppss!",
                    text: "Date range overlaps with existing earnings period",
                    timer: 2000,
                    button: false,
                  });
                } else {
                  swal({
                    icon: "error",
                    title: "Something went wrong",
                    text: "Please contact your support immediately",
                    timer: 2000,
                    button: false,
                  });
                }
              });
          } catch (error) {
            console.log(error);
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact your support immediately",
              timer: 2000,
              button: false,
            });
          }
        }
      });
    }
    setValidated(true);
  };

  const updateEarnings = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      swal({
        title: "Confirm Action",
        text: "Are you sure you want to update this earnings period?",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          try {
            axios
              .post(`${BASE_URL}/earnings/updateEarnings`, {
                id: toUpdateID,
                selectedOptionsCutoff,
                earning_name,
                userLoggedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    icon: "success",
                    title: "Success",
                    text: "Earnings updated successfully",
                    timer: 2000,
                    button: false,
                  }).then(() => {
                    handleClose();
                    getEarnings();
                  });
                } else if (res.status === 201) {
                  swal({
                    icon: "error",
                    title: "Oppss!",
                    text: "Date range overlaps with existing earnings period",
                    timer: 2000,
                    button: false,
                  });
                } else {
                  swal({
                    icon: "error",
                    title: "Something went wrong",
                    text: "Please contact your support immediately",
                    timer: 2000,
                    button: false,
                  });
                }
              });
          } catch (error) {
            console.log(error);
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact your support immediately",
              timer: 2000,
              button: false,
            });
          }
        }
      });
    }
    setValidated(true);
  };

  const handleDeleteEarnings = (id) => {
    swal({
      title: "Confirm Action",
      text: "Are you sure you want to delete this earnings period?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        try {
          axios
            .post(`${BASE_URL}/earnings/deleteEarnings`, null, {
              params: { id, userLoggedID },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  icon: "success",
                  title: "Success",
                  text: "Earnings deleted successfully",
                  timer: 2000,
                  button: false,
                }).then(() => {
                  handleClose();
                  getEarnings();
                });
              } else {
                swal({
                  icon: "error",
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  timer: 2000,
                  button: false,
                });
              }
            })
            .catch((error) => {
              console.log(error);
              swal({
                icon: "error",
                title: "Something went wrong",
                text: "Please contact your support immediately",
                timer: 2000,
                button: false,
              });
            });
        } catch (error) {
          console.log(error);
          swal({
            icon: "error",
            title: "Something went wrong",
            text: "Please contact your support immediately",
            timer: 2000,
            button: false,
          });
        }
      }
    });
  };

  // Add this new handler function
  const handleCardSelect = (basicId, netAmount, name) => {
    setSelectedEarnings((prev) => {
      const isSelected = prev.some((item) => item.basicId === basicId);

      const newSelection = isSelected
        ? prev.filter((item) => item.basicId !== basicId)
        : [...prev, { basicId, netAmount, name }];

      // Update the boolean based on selection length
      setHasSelectedEarnings(newSelection.length > 0);
      setSelectedEarningsNetAmount(
        newSelection.reduce((acc, item) => acc + item.netAmount, 0)
      );
      return newSelection;
    });
  };
  // console.log(selectedEarnings);
  const handleFetchOwnerList = async () => {
    setShowReturnEarnings(true);
    await axios.get(`${BASE_URL}/earnings/getOwnerList`).then((res) => {
      // First pass: calculate initial values
      let newMap = res.data.map((owner) => {
        const toReturn =
          selectedEarningsNetAmount * (owner.shared_percentage / 100);
        const newBalance =
          owner.amount + toReturn / parseFloat(owner.currency_rate);
        const computedCapitalBalance =
          parseFloat(owner.investment_amount) - parseFloat(newBalance);

        let formatToReturn = String(toReturn).replace(
          /\B(?=(\d{3})+(?!\d))/g,
          ","
        );
        return {
          ...owner,
          toReturn: formatToReturn,
          newBalance,
          capitalBalance: computedCapitalBalance,
        };
      });

      // Calculate total distributed amount
      const totalDistributed = newMap.reduce(
        (sum, owner) =>
          sum + parseFloat(String(owner.toReturn).replace(/,/g, "")),
        0
      );

      // If total distributed is greater than net amount, adjust proportionally
      if (totalDistributed > selectedEarningsNetAmount) {
        const adjustmentFactor = selectedEarningsNetAmount / totalDistributed;

        newMap = newMap.map((owner) => {
          // Adjust toReturn amount
          const adjustedToReturn =
            Math.floor(
              parseFloat(String(owner.toReturn).replace(/,/g, "")) *
                adjustmentFactor *
                100
            ) / 100; // Round down to 2 decimal places

          // Recalculate balances with adjusted amount
          const newBalance =
            owner.amount + adjustedToReturn / parseFloat(owner.currency_rate);
          const computedCapitalBalance =
            parseFloat(owner.investment_amount) - parseFloat(newBalance);

          let formatAdjustedToReturn = String(adjustedToReturn).replace(
            /\B(?=(\d{3})+(?!\d))/g,
            ","
          );
          return {
            ...owner,
            toReturn: formatAdjustedToReturn,
            newBalance,
            capitalBalance: computedCapitalBalance,
          };
        });

        // Distribute any remaining small difference due to rounding to the highest percentage owner
        const adjustedTotal = newMap.reduce(
          (sum, owner) =>
            sum + parseFloat(String(owner.toReturn).replace(/,/g, "")),
          0
        );
        const remainingDifference = selectedEarningsNetAmount - adjustedTotal;

        if (remainingDifference > 0) {
          // Find owner with highest percentage
          const highestPercentageOwner = newMap.reduce((prev, current) =>
            prev.shared_percentage > current.shared_percentage ? prev : current
          );

          // Add the remaining difference to the highest percentage owner
          newMap = newMap.map((owner) => {
            if (owner.id === highestPercentageOwner.id) {
              const finalToReturn =
                parseFloat(String(owner.toReturn).replace(/,/g, "")) +
                remainingDifference;
              const finalNewBalance =
                owner.amount + finalToReturn / parseFloat(owner.currency_rate);
              const finalCapitalBalance =
                parseFloat(owner.investment_amount) -
                parseFloat(finalNewBalance);
              let formatFinalToReturn = String(finalToReturn).replace(
                /\B(?=(\d{3})+(?!\d))/g,
                ","
              );
              return {
                ...owner,
                toReturn: formatFinalToReturn,
                newBalance: finalNewBalance,
                capitalBalance: finalCapitalBalance,
              };
            }
            return owner;
          });
        }
      }

      setOwnerList(newMap);
    });
  };

  // const handleToReturnChange = (
  //   ownerId,
  //   value,
  //   currentBalance,
  //   currency_rate,
  //   investment_amount,
  //   shared_percentage
  // ) => {
  //   // Prevent multiple decimal points
  //   if (value.split(".").length > 2) return;

  //   // Only allow numbers and decimal point
  //   if (!/^\d*\.?\d*$/.test(value) && value !== "") return;

  //   // Calculate what the new total distributed earnings would be
  //   const newValue = value === "" ? 0 : parseFloat(value);
  //   const currentOwnerContribution =
  //     ownerList.find((owner) => owner.id === ownerId)?.toReturn || 0;
  //   const otherOwnersTotal =
  //     totalDistributedEarnings - parseFloat(currentOwnerContribution);
  //   const newTotal = otherOwnersTotal + newValue;

  //   // Calculate maximum allowed based on shared percentage
  //   const maxAllowedByPercentage =
  //     selectedEarningsNetAmount * (shared_percentage / 100);

  //   // If new value exceeds percentage-based limit or total net amount
  //   if (
  //     newValue > maxAllowedByPercentage ||
  //     newTotal > selectedEarningsNetAmount
  //   ) {
  //     // Use the lower of the two limits
  //     const maxAllowedValue = Math.min(
  //       maxAllowedByPercentage,
  //       selectedEarningsNetAmount - otherOwnersTotal
  //     );

  //     swal({
  //       icon: "warning",
  //       title: "Maximum Value Reached",
  //       text: `Value has been adjusted to the maximum allowed amount: ${maxAllowedValue.toLocaleString(
  //         "en-US",
  //         {
  //           style: "currency",
  //           currency: "PHP",
  //           maximumFractionDigits: 2,
  //         }
  //       )} (${shared_percentage}% of total earnings)`,
  //     });

  //     // Update owner list with max allowed value
  //     setOwnerList((prevList) =>
  //       prevList.map((owner) => {
  //         if (owner.id === ownerId) {
  //           const numericToReturn = maxAllowedValue / parseFloat(currency_rate);
  //           const newBalance = parseFloat(currentBalance) + numericToReturn;
  //           const computedCapitalBalance =
  //             parseFloat(investment_amount) - parseFloat(newBalance);

  //           return {
  //             ...owner,
  //             toReturn: maxAllowedValue.toString(),
  //             newBalance,
  //             capitalBalance: computedCapitalBalance,
  //           };
  //         }
  //         return owner;
  //       })
  //     );
  //     return;
  //   }

  //   // If value is within limits, proceed with normal update
  //   setOwnerList((prevList) =>
  //     prevList.map((owner) => {
  //       if (owner.id === ownerId) {
  //         const toReturn = value;
  //         const numericToReturn =
  //           value === "" ? 0 : parseFloat(value) / parseFloat(currency_rate);
  //         const newBalance = parseFloat(currentBalance) + numericToReturn;
  //         const computedCapitalBalance =
  //           parseFloat(investment_amount) - parseFloat(newBalance);

  //         return {
  //           ...owner,
  //           toReturn,
  //           newBalance,
  //           capitalBalance: computedCapitalBalance,
  //         };
  //       }
  //       return owner;
  //     })
  //   );
  // };

  const handleToReturnChange = (
    ownerId,
    value,
    currentBalance,
    currency_rate,
    investment_amount,
    shared_percentage
  ) => {
    // Ensure value is a string

    if (typeof value !== "string") value = String(value);

    if (value === ".") {
      setOwnerList((prevList) =>
        prevList.map((owner) =>
          owner.id === ownerId
            ? { ...owner, toReturn: (owner.toReturn || "") + "." }
            : owner
        )
      );
      return;
    }

    // Clean input (allow only numbers and a single dot)
    let inputValue = String(value).replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    // inputValue =
    //   decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    // Parse numeric value for calculations
    const newValue = parseFloat(inputValue.replace(/,/g, "")) || 0;

    console.log("New Val", newValue);

    const formatOwnerList = ownerList.map((item) => ({
      ...item,
      toReturn: parseFloat(item.toReturn.replace(/,/g, "")),
    }));

    const currentOwnerContribution =
      formatOwnerList.find((owner) => owner.id === ownerId)?.toReturn || 0;

    const otherOwnersTotal =
      totalDistributedEarnings - parseFloat(currentOwnerContribution);
    const newTotal = otherOwnersTotal + newValue;

    // Calculate maximum allowed based on shared percentage
    const maxAllowedByPercentage =
      selectedEarningsNetAmount * (shared_percentage / 100);

    // If new value exceeds the limits
    if (
      newValue > maxAllowedByPercentage ||
      newTotal > selectedEarningsNetAmount
    ) {
      const maxAllowedValue = Math.min(
        maxAllowedByPercentage,
        selectedEarningsNetAmount - otherOwnersTotal
      );

      swal({
        icon: "warning",
        title: "Maximum Value Reached",
        text: `Value has been adjusted to the maximum allowed amount: ${maxAllowedValue.toLocaleString(
          "en-US",
          {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 2,
          }
        )} (${shared_percentage}% of total earnings)`,
      });

      // Update with max allowed value
      setOwnerList((prevList) =>
        prevList.map((owner) => {
          if (owner.id === ownerId) {
            const numericToReturn = maxAllowedValue / parseFloat(currency_rate);
            const newBalance = parseFloat(currentBalance) + numericToReturn;
            const computedCapitalBalance =
              parseFloat(investment_amount) - newBalance;

            const formatMaxAllowed = String(maxAllowedValue).replace(
              /\B(?=(\d{3})+(?!\d))/g,
              ","
            );
            return {
              ...owner,
              toReturn: formatMaxAllowed,
              newBalance,
              capitalBalance: computedCapitalBalance,
            };
          }
          return owner;
        })
      );
      return;
    }

    // Normal update if within limits
    setOwnerList((prevList) =>
      prevList.map((owner) => {
        if (owner.id === ownerId) {
          const numericToReturn = newValue / parseFloat(currency_rate);
          const newBalance = parseFloat(currentBalance) + numericToReturn;
          const computedCapitalBalance =
            parseFloat(investment_amount) - newBalance;

          return {
            ...owner,
            toReturn: formattedValue, // Store formatted value
            newBalance,
            capitalBalance: computedCapitalBalance,
          };
        }
        return owner;
      })
    );
  };

  const totalDistributedEarnings = ownerList.reduce(
    (acc, owner) => acc + parseFloat(String(owner.toReturn).replace(/,/g, "")),
    0
  );

  const handleSaveRetainEarnings = () => {
    swal({
      title: "Confirm Action",
      text: "Are you sure you want to save this retained earnings?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (confirmed) => {
      if (confirmed) {
        const formatOwnerList = ownerList.map((item) => ({
          ...item,
          toReturn: parseFloat(String(item.toReturn).replace(/,/g, "")),
        }));

        try {
          await axios
            .post(`${BASE_URL}/earnings/saveRetainEarnings`, {
              ownerList: formatOwnerList,
              selectedEarningsNetAmount,
              selectedEarnings,
              totalDistributedEarnings,
              floatPayment,
              userLoggedID,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  icon: "success",
                  title: "Success",
                  text: "Retained earnings saved successfully",
                  timer: 2000,
                  button: false,
                }).then(() => {
                  handleClose();
                  setSelectedEarnings([]);
                  handleFetchOwnerList();
                  setHasSelectedEarnings(false);
                  setShowReturnEarnings(false);
                  getEarnings();
                });
              }
            });
        } catch (error) {
          swal({
            icon: "error",
            title: "Something went wrong",
            text: "Please contact your support immediately",
            timer: 2000,
            button: false,
          });
          console.log(error);
        }
      }
    });
  };

  const handleShowViewReturned = () => {
    setShowViewReturned(true);

    axios.get(`${BASE_URL}/earnings/getViewReturned`).then((res) => {
      setViewReturnedData(res.data);
      console.log(res.data);
    });
  };
  const [totalViewDetails, setTotalViewDetails] = useState(0);
  const [ownerViewCurrency, setOwnerViewCurrency] = useState([]);

  const handleViewFunds = (owner) => {
    setShowViewReturnedDetails(false);
    setShowViewFunds(true);

    setOwnerIdToAddFunds(owner.id);
    setOwnerNameToAddFunds(owner.owner_name);
    setOwnerToReturnAmount(owner.toReturn);
    // // First, let's debug the entire owner object
    // console.log("Full owner object:", owner);
  };
  const [selectedDataToReturn, setSelectedDataToReturn] = useState([]);
  const [selectedDataToReturnStatus, setSelectedDataToReturnStatus] =
    useState("");

  const handleReturnCapital = (type) => {
    // console.log(type, selectedDataToReturn);
    let text = "";
    let textThen = "";
    if (type === "approve") {
      text = "Are you sure you want to approve this return capital?";
      textThen = "Approved";
    } else {
      text = "Are you sure you want to cancel this return capital?";
      textThen = "Canceled";
    }

    swal({
      title: "Confirm Action",
      text: text,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (confirmed) => {
      if (confirmed) {
        try {
          await axios
            .post(`${BASE_URL}/earnings/approveReturnCapital`, {
              arrayData: selectedDataToReturn,
              type: type,
              floatPayment,
              userLoggedID,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  icon: "success",
                  title: "Success",
                  text: `${textThen} successfully`,
                  timer: 2000,
                  button: false,
                }).then(() => {
                  getEarnings();
                  handleFetchOwnerList();
                  handleClose();
                });
              }
            });
        } catch (error) {
          console.log(error);
        }
      }
    });
  };

  const handleViewReturnedDetails = (array) => {
    setShowViewReturned(false);
    setShowViewReturnedDetails(true);
    setSelectedEarningsNetAmount(array.total_net_amount);
    setTotalViewDetails(array.total_distributed_amount);
    setSelectedDataToReturn(array.return_child_retaineds);
    setSelectedDataToReturnStatus(array.status);
    setFloatPayment([]);

    // console.log(array[0].return_capital_mother_id);

    // Map owner lists and set float payments separately
    const ownerListsss = array.return_owner_lists.map((owner) => {
      // console.log(owner);
      // console.log(owner);
      // Add float payment if it exists
      // Check if return_capital_payments exists and is an array
      if (Array.isArray(owner.return_capital_payments)) {
        // If it's an array, map through it
        owner.return_capital_payments.forEach((payment, index) => {
          // console.log(`Payment ${index}:`, payment.amount);

          const type = payment.type;
          const ownerId = owner.account_list_sub3_id;
          const subject3 = payment.account_list_id_payment;
          const accountName = payment.account_list_sub3.account_name;
          const currencyName = payment.account_list_sub3.currency.currency_name;
          const amount = payment.amount;
          const date = payment.date;
          const checkNumber = payment.check_number;

          setFloatPayment((prevPayments) => [
            ...prevPayments,
            {
              id: prevPayments.length + 1,
              type: type,
              ownerId: ownerId,
              subject3: subject3,
              accountName: accountName,
              currencyName: currencyName,
              amount: amount,
              date: date,
              checkNumber: checkNumber,
            },
          ]);
        });
      } else {
        // If it's not an array, log the entire object
        console.log("not an arrasssy:");
        // console.log("return_capital_payments:", owner.return_capital_payments);
      }

      const formatOwnerToReturn = String(owner.to_return_amount).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      );
      // Return owner data
      return {
        id: owner.account_list_sub3.id,
        owner_name: owner.account_list_sub3.account_name,
        investment_amount: owner.invested_amount,
        amount: owner.current_balance,
        shared_percentage: owner.shared_percentage,
        toReturn: formatOwnerToReturn,
        currency_name: owner.account_list_sub3.currency.currency_name,
        newBalance: owner.new_balance,
        capitalBalance: owner.capital_balance,
        return_capital_payments: owner.return_capital_payments,
      };
    });

    setOwnerViewCurrency(ownerListsss);
  };

  const handleSubject2Change = (selectedOption) => {
    setSelectedSubject2(selectedOption);

    axios
      .get(`${BASE_URL}/accountListSub/getSubject3`, {
        params: {
          subjectId: selectedOption?.value,
        },
      })
      .then((res) => {
        setAccountListSub3(res.data);
      });
  };

  // const handleClearAddFunds = () => {
  //   setShowAddFunds(false);
  //   setOwnerIdToAddFunds(null);
  //   setOwnerNameToAddFunds("");
  //   setSelectedSubject2(null);
  //   setSelectedSubject3(null);
  //   setSelectedPayment("Bank");
  //   setAccountListSub2([]);
  //   setAccountListSub3([]);
  // };

  const handleClearAddFundsDetails = () => {
    setSelectedSubject2("");
    setSelectedSubject3("");
    setAmountToAddFunds("");
    setCheckNumber("");
    setDatePayment("");
    setAccountListSub3([]);
    getAccountListSub2();
  };

  // const handleAmountToAddFunds = (value) => {
  //   const totalAmount = floatPayment
  //     .filter((item) => item.ownerId === ownerIdToAddFunds)
  //     .reduce((acc, item) => acc + parseFloat(item.amount), 0);
  //   const updatedAmount = parseFloat(totalAmount) + parseFloat(value);
  //   const ownerToReturnAmount_checker = ownerToReturnAmount - totalAmount;

  //   // alert(updatedAmount);

  //   const accountAmount = accountListSub3.find(
  //     (account) => parseFloat(account.id) === parseFloat(selectedSubject3)
  //   )?.amount;
  //   if (updatedAmount > ownerToReturnAmount) {
  //     swal({
  //       icon: "warning",
  //       title: "Minimum Value Reached",
  //       text: "Value has been adjusted to the minimum allowed amount",
  //     }).then(() => {
  //       setAmountToAddFunds(ownerToReturnAmount_checker);
  //     });
  //   } else if (value > accountAmount) {
  //     swal({
  //       icon: "warning",
  //       title: "Maximum Value Reached",
  //       text: "Value has been adjusted to the maximum allowed amount",
  //     }).then(() => {
  //       setAmountToAddFunds(accountAmount);
  //     });
  //   } else {
  //     setAmountToAddFunds(value);
  //   }
  // };

  const handleAmountToAddFunds = (value) => {
    if (value == ".") {
      setAmountToAddFunds((prev) => prev + ".");
    }

    let inputValue = String(value).replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    inputValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    let formatAmount = inputValue.replace(/,/g, "");
    // Convert to number and format with commas
    let numericValue = parseFloat(formatAmount);

    const totalAmount = floatPayment
      .filter((item) => item.ownerId === ownerIdToAddFunds)
      .reduce((acc, item) => acc + parseFloat(item.amount), 0);
    const updatedAmount = parseFloat(totalAmount) + parseFloat(numericValue);
    const ownerToReturnAmount_checker =
      parseFloat(String(ownerToReturnAmount).replace(/,/g, "")) - totalAmount;

    // alert(updatedAmount);

    const accountAmount = accountListSub3.find(
      (account) => String(account.id) === String(selectedSubject3?.value)
    )?.amount;
    if (
      updatedAmount > parseFloat(String(ownerToReturnAmount).replace(/,/g, ""))
    ) {
      swal({
        icon: "warning",
        title: "Minimum Value Reached",
        text: "Value has been adjusted to the minimum allowed amount",
      }).then(() => {
        let formatOwnerReturn = String(ownerToReturnAmount_checker).replace(
          /\B(?=(\d{3})+(?!\d))/g,
          ","
        );
        setAmountToAddFunds(formatOwnerReturn);
      });
    } else if (numericValue > accountAmount) {
      swal({
        icon: "warning",
        title: "Maximum Value Reached",
        text: "Value has been adjusted to the maximum allowed amount",
      }).then(() => {
        let formatAccountAmount = String(accountAmount).replace(
          /\B(?=(\d{3})+(?!\d))/g,
          ","
        );

        setAmountToAddFunds(formatAccountAmount);
      });
    } else {
      setAmountToAddFunds(inputValue);
    }
  };

  const handleAddFunds = async (e) => {
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
      swal({
        icon: "warning",
        title: "Confirm Action",
        text: "Are you sure you want to add funds?",
        buttons: true,
        dangerMode: true,
      }).then(async (confirmed) => {
        if (confirmed) {
          const accountName = accountListSub3.find(
            (account) => String(account.id) === String(selectedSubject3?.value)
          )?.account_name;
          const currencyName = accountListSub3.find(
            (account) => String(account.id) === String(selectedSubject3?.value)
          )?.currency.currency_name;
          const newPayment = {
            id: floatPayment.length + 1,
            type: selectedPayment,
            ownerId: ownerIdToAddFunds,
            subject3: selectedSubject3?.value,
            accountName: accountName,
            currencyName: currencyName,
            amount: parseFloat(String(amountToAddFunds).replace(/,/g, "")),
            date: datePayment,
            checkNumber: checkNumber,
          };
          setFloatPayment((prevPayments) => [...prevPayments, newPayment]);
          handleClearAddFundsDetails();
        }
      });
    }
  };

  const checkVAlidation_forSave = ownerList
    .filter((item) => {
      // Calculate the total payment for the current owner
      const totalPayment = floatPayment
        .filter((payment) => payment.ownerId === item.id)
        .reduce((acc, payment) => acc + parseFloat(payment.amount), 0);

      // Get the total toReturn amount for the current owner
      const toReturnAmount =
        parseFloat(String(item.toReturn).replace(/,/g, "")) || 0;

      // Find owners whose total payment is NOT equal to the toReturnAmount
      return totalPayment !== toReturnAmount;
    })
    .map((item) => item.owner_name) // Map to owner's name
    .join(", "); // Join the names with a comma for display

  // console.log(floatPayment);

  // Subject 2 Options for dropdown select
  const subject2Options = accountListSub2
    .filter((item) => item.subject_type === selectedPayment)
    .map((item) => ({ value: item.id, label: item.subject_name }));

  // Subject 3 Options for dropdown select
  const subject3Options = accountListSub3.map((item) => ({
    value: item.id,
    label: item.account_name,
  }));

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, generateYears }, ref) => (
      <input
        type="text"
        className="form-control p-2 w-100"
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

  console.log(selectedEarnings);
  console.log(authrztn);

  return authrztn.includes("Retained-View") ? (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3 text-uppercase">Retained Earnings</span>
        </div>
        <div className="d-flex gap-2">
          <Button
            className="btn d-flex align-items-center title-button"
            variant="secondary"
            onClick={handleShowViewReturned}
          >
            <i class="bx bx-search-alt"></i> View Retained Earnings
          </Button>
          {hasSelectedEarnings ? (
            <Button variant="warning" onClick={handleFetchOwnerList}>
              Return Earnings
            </Button>
          ) : (
            userLoggedID === "11111111-1111-1111-1111-111111111111" &&
            authrztn.includes("Retained-Add") && (
              <Button
                className="btn d-flex align-items-center title-button"
                variant="primary"
                onClick={handleShow}
              >
                <i className="bx bx-plus fs-5"></i> Add Earnings
              </Button>
            )
          )}
        </div>
      </div>

      <div className="w-100 pt-3 px-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="w-100 p-4">
        <div className="row g-4">
          {earnings.map((earning) =>
            earning.basic_info.map((basic) => (
              <div className="col-md-4" key={basic.id}>
                <div
                  className={`card border-1 shadow-sm rounded-4 hover-lift transition-shadow cursor-pointer ${
                    selectedEarnings.some((item) => item.basicId === basic.id)
                      ? "border-primary border-2"
                      : ""
                  }`}
                  onClick={() =>
                    basic.isAdded
                      ? null
                      : handleCardSelect(
                          basic.id,
                          earning.netAmount,
                          basic.name
                        )
                  }
                  style={{ cursor: basic.iAdded ? "not-allowed" : "pointer" }}
                >
                  <div className="card-body p-4 position-relative">
                    {selectedEarnings.some(
                      (item) => item.basicId === basic.id
                    ) && (
                      <div className="position-absolute top-0 end-0 m-2">
                        <i className="bi bi-check-circle-fill text-primary fs-5"></i>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="card-title mb-0 text-primary">
                        {basic.name}
                      </h5>
                      <span
                        className={`badge ${
                          basic.isAdded
                            ? "bg-success-subtle text-success"
                            : "bg-danger-subtle text-danger"
                        } rounded-pill px-3 py-2 fw-medium`}
                      >
                        {basic.isAdded ? "ADDED" : "PENDING"}
                      </span>
                    </div>

                    <div className="bg-light rounded-4 p-3 mb-4">
                      <div className="text-muted small mb-1">Net Amount</div>
                      <div className="fw-bold text-dark fs-4">
                        {earning.netAmount.toLocaleString("en-US", {
                          style: "currency",
                          currency: "PHP",
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <div className="d-flex align-items-center bg-white rounded-4 p-3">
                      <i className="bi bi-calendar-range text-primary fs-4 me-3"></i>
                      <div className="flex-grow-1">
                        <div className="small text-muted mb-1">Period</div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-medium">
                            {/* {new Date(basic.from).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })} */}
                            {basic.from && format(basic.from, "MMM/dd/yyyy")}
                          </span>
                          <i className="bi bi-arrow-right text-muted">to</i>
                          <span className="fw-medium">
                            {/* {new Date(basic.to).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })} */}
                            {basic.to && format(basic.to, "MMM/dd/yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button
                        className="btn btn-light flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewEarnings(basic.id);
                        }}
                      >
                        <i className="fa fa-eye text-primary"></i>
                        <span>View</span>
                      </button>
                      {authrztn.includes("Retained-Edit") && (
                        <button
                          className="btn btn-light flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowUpdate(earning);
                          }}
                          disabled={basic.isAdded}
                        >
                          <i className="fa fa-pencil text-warning"></i>
                          <span>Edit</span>
                        </button>
                      )}
                      {authrztn.includes("Retained-Delete") && (
                        <button
                          className="btn btn-light d-flex align-items-center justify-content-center px-3"
                          onClick={(e) => {
                            e.stopPropagation();

                            if (
                              selectedEarnings.some(
                                (item) => item.basicId === basic.id
                              )
                            ) {
                              setSelectedEarnings((prev) => {
                                const newSelection = prev.filter(
                                  (item) => item.basicId !== basic.id
                                );
                                // Update the boolean based on selection length
                                setHasSelectedEarnings(newSelection.length > 0);
                                setSelectedEarningsNetAmount(
                                  newSelection.reduce(
                                    (acc, item) => acc + item.netAmount,
                                    0
                                  )
                                );
                                return newSelection;
                              });
                            }

                            handleDeleteEarnings(basic.id);
                          }}
                          disabled={basic.isAdded}
                        >
                          <i className="fa fa-trash text-danger"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        show={show}
        backdrop="static"
        keyboard={false}
        onHide={handleClose}
      >
        <Form noValidate validated={validated} onSubmit={addNew}>
          <Modal.Header closeButton>
            <Modal.Title>Add Earnings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row mb-3">
              <div className="col-sm">
                <label>Earnings Name :</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-file-earmark-text"></i>
                  </span>
                  <input
                    type="text"
                    value={earning_name}
                    onChange={(e) => setEarning_name(e.target.value)}
                    className="form-control"
                    placeholder="Enter earnings name"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-sm">
                <label htmlFor="subject2">Select Posted Cutoff</label>
                <div
                  onMouseDown={(e) => {
                    if (cutoffOptions.length === 0) {
                      e.preventDefault();
                      swal({
                        icon: "warning",
                        title: "No Posted Cutoff Found",
                        text: "No posted cutoffs available. Please post a cutoff first.",
                      });
                      return;
                    }
                  }}
                >
                  <MultiSelect
                    required
                    options={cutoffOptions}
                    value={selectedOptionsCutoff}
                    onChange={handleChange}
                    labelledBy="Select"
                    className="w-100" // Full-width select component
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" type="button" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              Add
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showUpdate}
        backdrop="static"
        keyboard={false}
        onHide={handleClose}
      >
        <Form noValidate validated={validated} onSubmit={updateEarnings}>
          <Modal.Header closeButton>
            <Modal.Title>Update Earnings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row mb-3">
              <div className="col-sm">
                <label>Earnings Name :</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-file-earmark-text"></i>
                  </span>
                  <input
                    type="text"
                    value={earning_name}
                    onChange={(e) => setEarning_name(e.target.value)}
                    className="form-control"
                    placeholder="Enter earnings name"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-sm">
                <label htmlFor="subject2">Select Posted Cutoff</label>
                <MultiSelect
                  required
                  options={cutoffOptions}
                  value={selectedOptionsCutoff}
                  onChange={handleChange}
                  labelledBy="Select"
                  className="w-100" // Full-width select component
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" type="button" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              Update
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal to display the return earnings distribution {addd} */}
      <Modal
        show={showReturnEarnings}
        backdrop="static"
        keyboard={false}
        onHide={handleClose}
        // size="xl"
        fullscreen={true}
        className="modern-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0 px-4">
          <Modal.Title className="w-100">
            <div className="d-flex flex-column">
              <h4 className="mb-3 fw-bold">Return Earnings Distribution</h4>
              <div className="d-flex flex-wrap gap-2">
                {selectedEarnings.map((item) => (
                  <span
                    key={item.basicId}
                    className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          {/* Summary Cards */}
          <div className="row g-4 mb-4">
            {/* Total Net Amount Card */}
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body p-4 bg-primary bg-opacity-10 rounded-3">
                  <div className="d-flex flex-column">
                    <span className="text-muted fs-6 mb-1">
                      Total Net Amount
                    </span>
                    <span className="fs-3 fw-bold text-primary">
                      {selectedEarningsNetAmount.toLocaleString("en-US", {
                        style: "currency",
                        currency: "PHP",
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Distributed Earnings Card */}
            <div className="col-md-6">
              <div className="card h-100">
                <div className="card-body p-4 bg-success bg-opacity-10 rounded-3">
                  <div className="d-flex flex-column">
                    <span className="text-muted fs-6 mb-1">
                      Total Distributed Earnings
                    </span>
                    <span className="fs-3 fw-bold text-success">
                      {totalDistributedEarnings.toLocaleString("en-US", {
                        style: "currency",
                        currency: "PHP",
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Owners Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3">Owner's Name</th>
                      <th className="border-0 px-4 py-3">Invested Amount</th>
                      <th className="border-0 px-4 py-3">Current Balance</th>
                      <th className="border-0 px-4 py-3">Shared Percentage</th>
                      <th className="border-0 px-4 py-3">To Return</th>
                      <th className="border-0 px-4 py-3">New Balance</th>
                      <th className="border-0 px-4 py-3">Capital Balance</th>
                      <th className="border-0 px-4 py-3">Add Funds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerList
                      .sort((a, b) => b.shared_percentage - a.shared_percentage)
                      .map((owner) => (
                        <tr key={owner.id}>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <span className="fw-medium">
                                {owner.owner_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {owner.investment_amount.toLocaleString("en-US", {
                              style: "currency",
                              currency: owner.currency_name,
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3">
                            {owner.amount.toLocaleString("en-US", {
                              style: "currency",
                              currency: owner.currency_name,
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge bg-primary-subtle text-primary rounded-pill">
                              {owner.shared_percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <InputGroup size="sm" style={{ width: "150px" }}>
                              <InputGroup.Text className="bg-light border-end-0">
                                ₱
                              </InputGroup.Text>
                              <Form.Control
                                className="border-start-0"
                                type="text"
                                value={owner.toReturn}
                                onChange={(e) =>
                                  handleToReturnChange(
                                    owner.id,
                                    e.target.value,
                                    owner.amount,
                                    owner.currency_rate,
                                    owner.investment_amount,
                                    owner.shared_percentage
                                  )
                                }
                              />
                            </InputGroup>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-success fw-medium">
                              {owner.newBalance.toLocaleString("en-US", {
                                style: "currency",
                                currency: owner.currency_name,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {owner.capitalBalance <= 0 ? (
                              <span className="text-success">0</span>
                            ) : (
                              <span className="text-dark">
                                {owner.capitalBalance.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: owner.currency_name,
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="primary"
                              className="btn btn-primary"
                              onClick={() => {
                                setShowAddFunds(true);
                                setOwnerIdToAddFunds(owner.id);
                                setOwnerNameToAddFunds(owner.owner_name);
                                setOwnerToReturnAmount(owner.toReturn);
                                getAccountListSub2();
                                setShowReturnEarnings(false);
                              }}
                            >
                              <i
                                class={`fa-solid fa-plus ${
                                  floatPayment.some(
                                    (item) => item.ownerId === owner.id
                                  )
                                    ? ""
                                    : "fa-bounce"
                                }`}
                              ></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal.Body>
        {checkVAlidation_forSave && (
          <span className="text-end px-4 py-2 text-danger badge">
            {`*Please allocate funds for "${checkVAlidation_forSave}"`}
          </span>
        )}

        <Modal.Footer className="border-0 pt-4 px-4">
          <Button variant="light" onClick={handleClose} className="px-4 py-2">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSaveRetainEarnings}
            disabled={checkVAlidation_forSave}
            className="px-4 py-2"
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal to display adding of payment*/}
      <Modal
        show={showAddFunds}
        backdrop="static"
        keyboard={false}
        onHide={() => {
          setShowAddFunds(false);
          setShowReturnEarnings(true);
          handleClearAddFundsDetails();
        }}
        size="xl"
        className="modern-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Add Funds for "{ownerNameToAddFunds} {ownerIdToAddFunds}"
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container-fluid mt-4">
            <div className="w-100 d-flex align-items-center mt-3 p-2">
              <h5>
                To Return:{" "}
                {ownerToReturnAmount.toLocaleString("en-US", {
                  style: "currency",
                  currency: "PHP",
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </h5>
              <hr className="flex-grow-1 mx-3" />
            </div>
            <div className="w-100 mt-4">
              <div className="w-100 p-2 mt-1 row">
                <div className="col-12 col-md-4 p-2">
                  <div className="w-100 border shadow-sm p-3 rounded">
                    <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                      <span className="fw-bold">Select Account</span>
                    </div>
                    <Form
                      noValidate
                      validated={validated}
                      onSubmit={handleAddFunds}
                    >
                      <Form.Group className="mb-3" controlId="payWith">
                        <Form.Label className="fw-bold">Type:</Form.Label>
                        <div className="d-flex">
                          <Form.Check
                            type="radio"
                            name="paymentType"
                            id="bank"
                            label="Bank"
                            value="Bank"
                            className="me-3"
                            checked={selectedPayment === "Bank"}
                            onChange={() => {
                              setSelectedPayment("Bank");
                              handleClearAddFundsDetails();
                            }}
                          />
                          <Form.Check
                            type="radio"
                            name="paymentType"
                            id="cash"
                            label="Cash"
                            value="Cash"
                            className="me-3"
                            checked={selectedPayment === "Cash"}
                            onChange={() => {
                              setSelectedPayment("Cash");
                              handleClearAddFundsDetails();
                            }}
                          />
                        </div>
                        {/* <div className="mt-2">
                        <input type="checkbox" /> <label>Online</label>
                      </div> */}
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Subject 1</Form.Label>
                        <Form.Select
                          className="form-select"
                          required
                          value={selectedSubject1}
                          onChange={(e) => setSelectedSubject1(e.target.value)}
                          disabled
                        >
                          {/* <option value="" selected disabled>
                          Select Subject 1
                        </option> */}
                          <option value="Account-List">Account-List</option>
                          <option value="Asset Account">Asset Account</option>
                          <option value="Liabilities Account">
                            Liabilities Account
                          </option>
                          <option value="Owner's Equity Account">
                            Owner's Equity Account
                          </option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Subject 2</Form.Label>
                        {/* <Form.Select
                          className="form-select"
                          value={selectedSubject2}
                          required
                          onChange={(e) => handleSubject2Change(e.target.value)}
                        >
                          <option value="" selected disabled>
                            Select Subject 2
                          </option>
                          {accountListSub2
                            .filter(
                              (item) => item.subject_type === selectedPayment
                            )
                            .map((item) => (
                              <option value={item.id}>
                                {item.subject_name}
                              </option>
                            ))}
                        </Form.Select> */}
                        <Select
                          options={subject2Options}
                          value={selectedSubject2}
                          onChange={handleSubject2Change}
                          placeholder={`Select Subject 2`}
                          styles={selectCustomStyles(
                            selectedSubject2,
                            validated
                          )}
                          required
                          isSearchable
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="accountName">
                        <Form.Label className="fw-bold">Accounts</Form.Label>
                        {/* <Form.Select
                          className="p-2"
                          value={selectedSubject3}
                          onChange={(e) => setSelectedSubject3(e.target.value)}
                          required
                        >
                          <option value="">Select Account name</option>
                          {accountListSub3.map((item) => (
                            <option value={item.id}>{item.account_name}</option>
                          ))}
                        </Form.Select> */}
                        <Select
                          options={subject3Options}
                          value={selectedSubject3}
                          onChange={(selectedOption) =>
                            setSelectedSubject3(selectedOption)
                          }
                          placeholder={`Select Account name`}
                          styles={selectCustomStyles(
                            selectedSubject3,
                            validated
                          )}
                          required
                          isSearchable
                        />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="amount">
                        <Form.Label>Amount</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">{}</span>
                          <Form.Control
                            type="text"
                            className="p-2 z-0"
                            required
                            placeholder="0.00"
                            value={amountToAddFunds}
                            onChange={(e) =>
                              handleAmountToAddFunds(e.target.value)
                            }
                            onInput={(e) => {
                              e.target.value = e.target.value
                                .replace(/[^0-9.]/g, "")
                                .replace(/(\.\d{2})\d+/g, "$1")
                                .replace(/(\.\d*)\./g, "$1");

                              if (e.target.value.includes(".")) {
                                e.target.value = e.target.value.substring(
                                  0,
                                  e.target.value.indexOf(".") + 3
                                );
                              }
                            }}
                          />
                        </div>
                        <span>
                          Account Balance:{" "}
                          <strong>
                            {accountListSub3
                              .find(
                                (account) =>
                                  String(account.id) ===
                                  String(selectedSubject3?.value)
                              )
                              ?.amount.toLocaleString("en-US", {
                                style: "currency",
                                currency: accountListSub3.find(
                                  (account) =>
                                    String(account.id) ===
                                    String(selectedSubject3?.value)
                                )?.currency.currency_name,
                              }) || "N/A"}
                          </strong>
                        </span>
                      </Form.Group>

                      {selectedPayment === "Bank" && (
                        <>
                          <Form.Group className="mb-3" controlId="date">
                            <Form.Label>Check Number</Form.Label>
                            <Form.Control
                              type="text"
                              value={checkNumber}
                              onChange={(e) => setCheckNumber(e.target.value)}
                              placeholder="xxxxxxxxxx"
                              className="p-2"
                              maxLength={15}
                            />
                          </Form.Group>
                        </>
                      )}

                      <Form.Group className="mb-3" controlId="date">
                        <Form.Label>Date</Form.Label>
                        {/* <Form.Control
                          type="date"
                          value={datePayment}
                          onChange={(e) => setDatePayment(e.target.value)}
                          required
                          className="p-2"
                        /> */}

                        {/* <DatePicker
                          selected={datePayment}
                          onChange={(date) => {
                            setDatePayment(date);
                          }}
                          dateFormat="MMM/dd/yyyy"
                          className="form-control p-2"
                          customInput={<CustomInput />}
                        /> */}
                        <CustomDatePicker
                          selected={datePayment ? new Date(datePayment) : ""}
                          handleDateChange={(date) => {
                            setDatePayment(date);
                          }}
                          setter={setDatePayment}
                          CustomInput={CustomInput}
                          isRequired={true}
                          validated={validated}
                        />
                      </Form.Group>

                      <Button
                        type="submit"
                        variant="primary"
                        className="w-100 p-2"
                      >
                        Add
                      </Button>
                    </Form>
                  </div>
                </div>

                <div className="col-12 col-md-8 p-2 d-flex flex-column">
                  <div className="">
                    <Tab.Container defaultActiveKey="paymentList">
                      <Nav variant="tabs">
                        <Nav.Item>
                          <Nav.Link
                            eventKey="paymentList"
                            className="text-dark custom-nav-link"
                          >
                            Account List
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>

                      <Tab.Content className="mt-3">
                        <Tab.Pane eventKey="paymentList">
                          <div className="border p-3 rounded">
                            <h5>Account List</h5>
                            <div className="table-responsive">
                              <Table bordered>
                                <thead>
                                  <tr>
                                    <th>Type</th>
                                    <th>Account Name</th>
                                    <th>Amount</th>
                                    <th>Check Number</th>
                                    <th>Issue Date</th>
                                    <th></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {floatPayment
                                    .filter(
                                      (item) =>
                                        item.ownerId === ownerIdToAddFunds
                                    )
                                    .map((data, i) => (
                                      <tr key={i}>
                                        <td>{data.type}</td>
                                        <td>{data.accountName}</td>
                                        <td>
                                          {data?.amount?.toLocaleString(
                                            "en-US",
                                            {
                                              style: "currency",
                                              currency:
                                                data?.currencyName || "PHP",
                                              maximumFractionDigits: 2,
                                              minimumFractionDigits: 2,
                                            }
                                          )}
                                        </td>
                                        <td>
                                          {data.checkNumber === ""
                                            ? "--"
                                            : data.checkNumber}
                                        </td>
                                        <td>
                                          {format(data.date, "MMM/dd/yyyy")}
                                        </td>
                                        <td>
                                          <Button
                                            variant="danger"
                                            onClick={() =>
                                              setFloatPayment(
                                                floatPayment.filter(
                                                  (item) => item.id !== data.id
                                                )
                                              )
                                            }
                                          >
                                            <i className="fa-solid fa-trash"></i>
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </Table>

                              <div className="d-flex justify-content-between">
                                <span>Total Amount Added</span>
                                <span className="text-secondary">
                                  {floatPayment
                                    .filter(
                                      (item) =>
                                        item.ownerId === ownerIdToAddFunds
                                    )
                                    .reduce(
                                      (acc, item) =>
                                        acc + parseFloat(item.amount),
                                      0
                                    )

                                    .toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Tab.Pane>
                      </Tab.Content>
                    </Tab.Container>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddFunds(false);
              handleClearAddFundsDetails();
              setShowReturnEarnings(true);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MOdal to disolay all the returned earnings  approval and rejection*/}
      <Modal
        show={showViewReturned}
        backdrop="static"
        keyboard={false}
        onHide={handleClose}
        fullscreen={true}
        className="modern-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>View Returned Earnings</Modal.Title>
        </Modal.Header>
        <Modal.Body
          className={`p-4 ${
            viewReturnedData.length === 0 &&
            "d-flex align-items-center justify-content-center"
          }`}
        >
          {viewReturnedData.length > 0 ? (
            viewReturnedData.map((item) => {
              const dates = item.return_child_retaineds.map((child) => ({
                from: new Date(child.return_earning.from),
                to: new Date(child.return_earning.to),
              }));
              const minDate = new Date(Math.min(...dates.map((d) => d.from)));
              const maxDate = new Date(Math.max(...dates.map((d) => d.to)));

              return (
                <div
                  key={item.id}
                  className="card shadow-sm mb-4 border-2 rounded-4"
                >
                  <div className="card-body p-0">
                    <div className="d-flex flex-column">
                      {/* Header Section with Status Badge */}
                      <div className="p-4 pb-3 border-bottom position-relative">
                        <div className="position-absolute top-0 end-0 pt-4 pe-4">
                          <span
                            className={`badge rounded-pill px-3 py-2 ${
                              item.status === "Approved"
                                ? "bg-success-subtle text-success"
                                : item.status === "Pending"
                                ? "bg-warning-subtle text-warning"
                                : "bg-danger-subtle text-danger"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <h5 className="mb-2 text-primary fw-semibold">
                          {item.name}
                        </h5>
                        <div className="d-flex align-items-center text-secondary small">
                          <i className="bi bi-calendar-range me-2"></i>
                          <span>
                            {minDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            {" - "}
                            {maxDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Financial Details Section */}
                      <div className="p-4 d-flex justify-content-between align-items-center flex-wrap">
                        <div className="d-flex gap-5">
                          {/* Total Earnings */}
                          <div>
                            <div className="text-secondary small mb-1">
                              Total Earnings
                            </div>
                            <div className="fs-4 fw-semibold text-success">
                              {parseFloat(item.total_net_amount).toLocaleString(
                                "en-US",
                                {
                                  style: "currency",
                                  currency: "PHP",
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </div>
                          </div>

                          {/* Distributed Earnings */}
                          <div>
                            <div className="text-secondary small mb-1">
                              Distributed Earnings
                            </div>
                            <div className="fs-4 fw-semibold text-primary">
                              {parseFloat(
                                item.total_distributed_amount
                              ).toLocaleString("en-US", {
                                style: "currency",
                                currency: "PHP",
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button
                          variant="outline-primary"
                          className="rounded-pill px-4 py-2"
                          onClick={() => handleViewReturnedDetails(item)}
                        >
                          <i className="bi bi-eye me-2"></i>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center">
              <img src={NoData} alt="No data" className="w-50 h-50" />
              <span className="fs-4 text-secondary">
                There's no data to display.
              </span>
            </div>
          )}
        </Modal.Body>
      </Modal>
      {/* Modal to display specific returned earnings details */}
      <Modal
        size="xl"
        show={showViewReturnedDetails}
        backdrop="static"
        keyboard={false}
        onHide={() => {
          setShowViewReturnedDetails(false);
          setOwnerViewCurrency([]);
          setShowViewReturned(true);
        }}
      >
        <Modal.Header closeButton={() => setShowViewReturnedDetails(false)}>
          <Modal.Title>Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Modal.Body className="px-4">
            {/* Summary Cards */}
            <div className="row g-4 mb-4">
              {/* Total Net Amount Card */}
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-body p-4 bg-primary bg-opacity-10 rounded-3">
                    <div className="d-flex flex-column">
                      <span className="text-muted fs-6 mb-1">
                        Total Net Amount
                      </span>
                      <span className="fs-3 fw-bold text-primary">
                        {selectedEarningsNetAmount.toLocaleString("en-US", {
                          style: "currency",
                          currency: "PHP",
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Distributed Earnings Card */}
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-body p-4 bg-success bg-opacity-10 rounded-3">
                    <div className="d-flex flex-column">
                      <span className="text-muted fs-6 mb-1">
                        Total Distributed Earnings
                      </span>
                      <span className="fs-3 fw-bold text-success">
                        {totalViewDetails.toLocaleString("en-US", {
                          style: "currency",
                          currency: "PHP",
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Owners Table */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 px-4 py-3">Owner's Name</th>
                        <th className="border-0 px-4 py-3">Invested Amount</th>
                        <th className="border-0 px-4 py-3">Current Balance</th>
                        <th className="border-0 px-4 py-3">
                          Shared Percentage
                        </th>
                        <th className="border-0 px-4 py-3">To Return</th>
                        <th className="border-0 px-4 py-3">New Balance</th>
                        <th className="border-0 px-4 py-3">Capital Balance</th>
                        <th className="border-0 px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownerViewCurrency
                        .sort(
                          (a, b) => b.shared_percentage - a.shared_percentage
                        )
                        .map((owner) => (
                          <tr key={owner.id}>
                            <td className="px-4 py-3">
                              <div className="d-flex align-items-center">
                                <span className="fw-medium">
                                  {owner.owner_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {owner.investment_amount.toLocaleString("en-US", {
                                style: "currency",
                                currency: owner.currency_name,
                              })}
                            </td>
                            <td className="px-4 py-3">
                              {owner.amount.toLocaleString("en-US", {
                                style: "currency",
                                currency: owner.currency_name,
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <span className="badge bg-primary-subtle text-primary rounded-pill">
                                {owner.shared_percentage}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <InputGroup size="sm" style={{ width: "150px" }}>
                                <InputGroup.Text className="bg-light border-end-0">
                                  ₱
                                </InputGroup.Text>
                                <Form.Control
                                  className="border-start-0"
                                  type="text"
                                  value={owner.toReturn}
                                  readOnly
                                  onChange={(e) =>
                                    handleToReturnChange(
                                      owner.id,
                                      e.target.value,
                                      owner.amount,
                                      owner.currency_rate,
                                      owner.investment_amount,
                                      owner.shared_percentage
                                    )
                                  }
                                />
                              </InputGroup>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-success fw-medium">
                                {owner.newBalance.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: owner.currency_name,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {owner.capitalBalance <= 0 ? (
                                <span className="text-success">0</span>
                              ) : (
                                <span className="text-dark">
                                  {owner.capitalBalance.toLocaleString(
                                    "en-US",
                                    {
                                      style: "currency",
                                      currency: owner.currency_name,
                                    }
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="outline-primary"
                                className="rounded-pill px-4 py-2"
                                size="sm"
                                onClick={() => handleViewFunds(owner)}
                              >
                                <i className="bi bi-eye me-2"></i>
                                View Funds
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {selectedDataToReturnStatus === "Pending" && (
                  <div className="text-end mt-5 mb-4">
                    <Button
                      variant="success"
                      className="rounded-pill px-4 py-2"
                      onClick={() => handleReturnCapital("approve")}
                    >
                      Return Capital / Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="rounded-pill px-4 py-2"
                      onClick={() => handleReturnCapital("cancel")}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>
        </Modal.Body>
      </Modal>

      {/* Modal to display all the returned earnings payments */}

      {/* Modal to display adding of payment*/}
      <Modal
        show={showViewFunds}
        backdrop="static"
        keyboard={false}
        onHide={() => {
          setShowViewFunds(false);
          setShowViewReturnedDetails(true);
        }}
        size="xl"
        className="modern-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Funds for "{ownerNameToAddFunds}"</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container-fluid mt-4">
            <div className="w-100 d-flex align-items-center mt-3 p-2">
              <h5>
                To Return:{" "}
                {ownerToReturnAmount.toLocaleString("en-US", {
                  style: "currency",
                  currency: "PHP",
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </h5>
              <hr className="flex-grow-1 mx-3" />
            </div>
            <div className="w-100 mt-4 ">
              <div className="w-100 p-2 mt-1 row">
                <div
                  className={`col-12 ${
                    ownerIdToAddFunds === "11111111-1111-1111-1111-111111111111"
                      ? "col-md-8"
                      : "col-md-12"
                  } p-2 d-flex flex-column `}
                >
                  <div className="">
                    <Tab.Container defaultActiveKey="paymentList">
                      <Nav variant="tabs">
                        <Nav.Item>
                          <Nav.Link
                            eventKey="paymentList"
                            className="text-dark custom-nav-link"
                          >
                            Account List
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>

                      <Tab.Content className="mt-3">
                        <Tab.Pane eventKey="paymentList">
                          <div className="border p-3 rounded">
                            <h5>Account List</h5>
                            <div className="table-responsive">
                              <Table bordered>
                                <thead>
                                  <tr>
                                    <th>Type</th>
                                    <th>Account Name</th>
                                    <th>Amount</th>
                                    <th>Check Number</th>
                                    <th>Issue Date</th>
                                    {/* <th></th> */}
                                  </tr>
                                </thead>
                                <tbody>
                                  {floatPayment
                                    .filter(
                                      (item) =>
                                        item.ownerId === ownerIdToAddFunds
                                    )
                                    .map((data, i) => (
                                      <tr>
                                        <td>{data.type}</td>
                                        <td>{data.accountName}</td>
                                        <td>
                                          {data?.amount?.toLocaleString(
                                            "en-US",
                                            {
                                              style: "currency",
                                              currency:
                                                data?.currencyName || "PHP",
                                              maximumFractionDigits: 2,
                                              minimumFractionDigits: 2,
                                            }
                                          )}
                                        </td>
                                        <td>
                                          {data.checkNumber === ""
                                            ? "--"
                                            : data.checkNumber}
                                        </td>
                                        <td>{data.date}</td>
                                        {/* <td>
                                          <Button
                                            variant="danger"
                                            onClick={() =>
                                              setFloatPayment(
                                                floatPayment.filter(
                                                  (item) => item.id !== data.id
                                                )
                                              )
                                            }
                                          >
                                            <i className="fa-solid fa-trash"></i>
                                          </Button>
                                        </td> */}
                                      </tr>
                                    ))}
                                </tbody>
                              </Table>

                              <div className="d-flex justify-content-between">
                                <span>Total Amount Added</span>
                                <span className="text-secondary">
                                  {floatPayment
                                    .filter(
                                      (item) =>
                                        item.ownerId === ownerIdToAddFunds
                                    )
                                    .reduce(
                                      (acc, item) =>
                                        acc + parseFloat(item.amount),
                                      0
                                    )

                                    .toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Tab.Pane>
                      </Tab.Content>
                    </Tab.Container>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowViewFunds(false);
              setShowViewReturnedDetails(true);
            }}
          >
            Back
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  ) : (
    <div className="no-access">
      <img src={NoAccess} alt="NoAccess" className="no-access-img" />
      <h3>You don't have access to this function.</h3>
    </div>
  );
}

export default ReturnEarnings;
