import React, { useState, useEffect } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import {
  useNavigate,
  useParams,
  Link,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import swal from "sweetalert";
// import BulkPayable from "./BulkPayable";
import { customStyles } from "../../../assets/table-style";
import DataTable from "react-data-table-component";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import { useDateValidation } from "../../../hooks/customHook/useDateValidation";
import { usePostedCutoffValidation } from "../../../hooks/customHook/usePostedCutoffValidation";
import CustomDatePicker from "../../../components/CustomDatePicker";

const NEW_view_bulk_payable = ({
  authrztn,
  setId,
  setIdToAdd,
  setEdit, // To determine if user is still editing then suddenly navigates to other page
  setRoute,
}) => {
  const { id, module } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [payableBulk, setPayableBulk] = useState([]);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [vendor, setVendor] = useState(null);
  const [balance, setBalance] = useState(0);
  const [payableDate, setPayableDate] = useState(null);
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("");
  const [vendorMap, setVendorMap] = useState([]);
  const [availablePayables, setAvailablePayables] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [allCurrency, setAllCurrency] = useState([]);
  const [isAmountDisabled, setIsAmountDisabled] = useState(true);
  const [currentDate, setCurrentDate] = useState("");
  const [payableList, setPayableList] = useState([
    {
      id: "",
      transactionId: "",
      invoiceDate: "",
      dueDate: "",
      amount: "",
      discount: "",
    },
  ]);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [isCutoffExists, setIsCutoffExists] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const userLoggedID = useDecodeToken();
  const { dateValidation } = useDateValidation();
  const { postedCutoffValidation } = usePostedCutoffValidation();

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [selectedRow, setSelectedRow] = useState([]);
  const [removePaymentListId, setRemovePaymentListId] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [storePreviousAvailablePayable, setStorePreviousAvailablePayable] =
    useState([]);
  const [withIsAddedPayable, setWithIsAddedPayable] = useState([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
  const [searchParams] = useSearchParams();
  const [selectedRowTransactions, setSelectedRowTransactions] = useState([]);
  const [transactionToGetBack, setTransactionToGetBack] = useState([]);
  const [currencyRate, setCurrencyRate] = useState(1);

  const isInputDisabled =
    balance === 0 ||
    (balance === 0 && !isEditing) ||
    (status === "For-Approval" && !isEditing);

  const deletePayment = (item, index) => {
    setFloatPayment((prev) => {
      return prev.filter((_, i) => {
        return index !== i;
      });
    });
    setBalance((prev) => {
      return prev + item.amountInputted;
    });
    if (item.id) {
      setRemovePaymentListId((prev) => {
        return [...prev, item?.id];
      });
    }
  };

  const submitModal = () => {
    // setAvailablePayables((prev) =>
    //   prev.filter((item) => !selectedRow.includes(item.id))
    // );

    // setPayableList((prev) => {
    //   const newPayables = availablePayables
    //     .filter((item) => selectedRow.includes(item.id))
    //     .map((item) => {
    //       // Find the selected payable for the current item
    //       const selectedPayable = availablePayables.find(
    //         (payable) => payable.transaction_id === item.transaction_id
    //       );

    //       console.log(selectedPayable, "selected payable");

    //       // Extract product price from payable_products
    //       const productPrice =
    //         selectedPayable?.payable_products?.[0]?.product_tag_vendor
    //           ?.product_price || "";

    //       let unitPrice = 0;
    //       // row.payable_products.forEach((data) => {
    //       //   unitPrice += data.product_tag_vendor.product_price * data.weight;
    //       // });
    //       selectedPayable.payable_products.forEach((data) => {
    //         unitPrice += data.unitPrice * data.weight;
    //       });

    //       const moisture = selectedPayable.payable_products?.reduce(
    //         (acc, data) => {
    //           if (data.moisture_type === "%") {
    //             return (
    //               acc +
    //               parseFloat(
    //                 (data.moisture / 100) * data.unitPrice * data.weight || 0
    //               )
    //             );
    //           } else {
    //             return acc + parseFloat(data.moisture || 0);
    //           }
    //         },
    //         0
    //       );

    //       const totalOtherFees =
    //         selectedPayable.payable_other_fees?.reduce(
    //           (acc, data) => acc + parseFloat(data.fee_amount || 0),
    //           0
    //         ) || 0;

    //       const calculateDiscount =
    //         selectedPayable.isPercent_Discount === true
    //           ? (selectedPayable.discount_value / 100) *
    //             parseFloat(
    //               unitPrice -
    //                 moisture -
    //                 selectedPayable.weighing_fee -
    //                 totalOtherFees
    //             )
    //           : selectedPayable.discount_value;

    //       const totalAmountPrice =
    //         unitPrice -
    //         moisture -
    //         selectedPayable.weighing_fee -
    //         totalOtherFees -
    //         calculateDiscount;

    //       return {
    //         ...item, // Preserve existing properties
    //         id: item.id || "",
    //         transactionId: item.transaction_id || "",
    //         invoiceDate: item.createdAt || "",
    //         purchaseDate: item.purchaseDate || "",
    //         description: item.description || "",
    //         dueDate: item.due_date || "",
    //         amount: productPrice || "",
    //         discount: item.discount_value || "",
    //         totalAmount: totalAmountPrice,
    //         payable: selectedPayable || null, // Attach selected payable details
    //         newItemList: true,
    //       };
    //     });

    //   return [...prev, ...newPayables];
    // });

    const mergedData = [
      ...new Set([...selectedRow, ...selectedRowTransactions]),
    ];

    fetchPayableList(
      payableBulk.vendor_id,
      module,
      searchTerm,
      filterColumn,
      payableList,
      payableBulk.currency_id,
      [],
      mergedData
    );

    setSelectedRowTransactions(mergedData);

    // Update added payable IDs
    setAddedIds((prevIds) => [
      ...prevIds,
      ...availablePayables
        .filter((item) => mergedData.includes(item.id))
        .map((item) => item.id),
    ]);

    pagination.setCurrentPage(1);
    setSelectedRow([]);
    setFilterColumn("all");
    setSearchTerm("");
    setShow(false);
  };

  const handleIndividualCheckBoxChange = (id) => {
    if (selectedRow.includes(id)) {
      setSelectedRow((prev) => {
        return prev.filter((item) => id !== item);
      });
    } else {
      setSelectedRow((prev) => {
        return [...prev, id];
      });
    }
  };

  const handleAllCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    if (isChecked == true) {
      setSelectedRow(availablePayables.map((item) => item.id));
    } else {
      setSelectedRow([]);
    }
  };

  const modalColumn = [
    {
      name: (
        <input type="checkbox" onChange={(e) => handleAllCheckboxChange(e)} />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedRow.includes(row.id)}
          onChange={() => handleIndividualCheckBoxChange(row.id)}
        />
      ),
    },
    {
      name: "Transaction ID",
      selector: (row) => row.transaction_id,
    },
    {
      name: "Remarks",
      selector: (row) => row.description,
    },
    {
      name: "Purchase Date",
      selector: (row) => `${format(row.purchaseDate, "MMM/dd/yyyy") || ""}`,
    },
    {
      name: "Due Date",
      selector: (row) => `${format(row.due_date, "MMM/dd/yyyy") || ""}`,
    },
    {
      name: "Amount",
      // selector: (row) =>
      //   // `${
      //   //   row.payable_products &&
      //   //   row.payable_products[0] &&
      //   //   row.payable_products[0].product_tag_vendor
      //   //     ? row.payable_products[0].product_tag_vendor.product_price
      //   //     : ""
      //   // }`,
      //   row.totalPrice.toLocaleString("en-US", {
      //     maximumFractionDigits: 2,
      //     minimumFractionDigits: 2,
      //   }),
      cell: (row) => {
        let unitPrice = 0;
        // row.payable_products.forEach((data) => {
        //   unitPrice += data.product_tag_vendor.product_price * data.weight;
        // });
        row.payable_products.forEach((data) => {
          unitPrice += data.unitPrice * data.weight;
        });

        const moisture = row.payable_products?.reduce((acc, data) => {
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

        const totalOtherFees =
          row.payable_other_fees?.reduce(
            (acc, data) => acc + parseFloat(data.fee_amount || 0),
            0
          ) || 0;

        const calculateDiscount =
          row.isPercent_Discount === true
            ? (row.discount_value / 100) *
              parseFloat(
                unitPrice - moisture - row.weighing_fee - totalOtherFees
              )
            : row.discount_value;

        return (
          <span className="text-center">
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
    {
      name: "Discount",
      selector: (row) => `${row.discount_value}`,
    },
  ];

  const addNewItem = () => {
    // setPayableList([
    //   ...payableList,
    //   {
    //     id: "",
    //     transactionId: "",
    //     invoiceDate: "",
    //     dueDate: "",
    //     amount: "",
    //     discount: "",
    //     newItemList: true,
    //   },
    // ]);

    // Avoid refetching for availablePayables if there are added payable already in the list of availablePayables
    // Avoid excluding all isAdded: true from payable route
    if (availablePayables.every((item) => item.isAdded == false)) {
      fetchPayableList(
        selectedVendorId,
        module,
        searchTerm,
        filterColumn,
        payableList,
        payableBulk.currency_id,
        [],
        selectedRowTransactions
      );
    }

    handleShow();

    // const vendorId = payableBulk.vendor_id;

    // const selectedTransactionIds = payableList.map(
    //   (item) => item.transactionId
    // );

    // axios
    //   // .get(`${BASE_URL}/payable/getInfobyVendor/?id=${vendorId}`)
    //   .get(`${BASE_URL}/payable/getInfobyVendor`, {
    //     params: {
    //       id: vendorId,
    //       module: module,
    //     },
    //   })
    //   .then((res) => {
    //     setAvailablePayables(
    //       res.data.filter(
    //         (payable) =>
    //           !selectedTransactionIds.includes(payable.transaction_id)
    //       )
    //     );
    //     setSelectedVendorId(vendorId);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching payables:", error);
    //   });
  };

  const deleteItem = async (item, index) => {
    const removedId = payableList[index]?.payable?.id;

    // Remove the item from payableList
    const updatedPayableList = [...payableList];
    updatedPayableList.splice(index, 1);

    // setAvailablePayables((prev) => {
    //   return [...prev, item.payable];
    // });

    // setStorePreviousAvailablePayable([...availablePayables, item.payable]);

    setPayableList(updatedPayableList);
    // setBalance((prev) => {
    //   console.log(prev - item.payable.totalPrice);
    //   return prev - item.payable.totalPrice;
    // });
    // console.log(item.payable.totalPrice);

    // Remove the ID from addedIds
    if (removedId) {
      setRemoveIds((prevIds) => [...prevIds, removedId]);
    }

    if (item.payable.isAdded === true) {
      await axios.put(`${BASE_URL}/payable/deleteOrderListTransaction`, {
        id,
        idToRemove: item.payable.id,
      });

      setTransactionToGetBack((prev) => [...prev, item.payable.id]);
      setIdToAdd((prev) => [...prev, item.payable.id]);
      setId(id);
      setRoute("payable");
    }

    // const mergedData = [
    //   ...new Set([...selectedRow, ...selectedRowTransactions]),
    // ];

    // fetchPayableList(
    //   payableBulk.vendor_id,
    //   module,
    //   searchTerm,
    //   filterColumn,
    //   payableList,
    //   payableBulk.currency_id,
    //   [],
    //   mergedData,
    //   notSelectedTransactions
    // );

    // setNotSelectedTransactions((prev) => [...prev, item.payable.id]);

    setSelectedRow((prev) => {
      return prev.filter((itemRow) => itemRow !== item.payable.id);
    });

    setSelectedRowTransactions((prev) => {
      return prev.filter((itemRow) => itemRow !== item.payable.id);
    });
  };

  const fetchCurrency = async () => {
    try {
      let res = await axios.get(`${BASE_URL}/currency/fetchCurrency`);
      setAllCurrency(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const dateToday = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${year}-${month}-${day}`;
  };

  const pagination = useServerPagination(
    `${BASE_URL}/payable/getInfobyVendor`,
    10
  );

  const fetchPayableList = (
    vendorId,
    module,
    searchTerm,
    filterColumn,
    payableList,
    currency,
    selectedTransactionIds = [],
    newSelectedTransactions
  ) => {
    pagination.updateParams({
      id: vendorId,
      module: module,
      searchText: searchTerm,
      filterColumn,
      payableList: payableList.map((item) => item.id),
      currency,
      selectedTransactions: newSelectedTransactions,
    });
    setSelectedTransactionIds(selectedTransactionIds);
    setSelectedVendorId(vendorId);
    // axios
    //   // .get(`${BASE_URL}/payable/getInfobyVendor/?id=${vendorId}`)
    //   .get(`${BASE_URL}/payable/getInfobyVendor`, {
    //     params: {
    //       id: vendorId,
    //       module: module,
    //       searchText: searchTerm,
    //       filterColumn,
    //       payableList,
    //       currency,
    //     },
    //   })
    //   .then((res) => {
    // if (selectedTransactionIds.length > 0) {
    //   setAvailablePayables(
    //     res.data.filter(
    //       (payable) =>
    //         !selectedTransactionIds.includes(payable.transaction_id)
    //     )
    //   );
    // } else {
    //   setAvailablePayables(res.data);
    // }
    // if (
    //   searchTerm == "" &&
    //   availablePayables.some((item) => item.isAdded == true)
    // ) {
    //   setAvailablePayables(storePreviousAvailablePayable);
    // } else {
    //   setAvailablePayables(
    //     storePreviousAvailablePayable.length > 0
    //       ? [
    //           ...res.data.filter(
    //             (payable) =>
    //               !selectedTransactionIds.includes(payable.transaction_id)
    //           ),
    //           ...storePreviousAvailablePayable
    //             .filter((item) => {
    //               const includesSearchTerm = (str, searchTerm) => {
    //                 return String(str)
    //                   .toLowerCase()
    //                   .includes(searchTerm.toLowerCase());
    //               };
    //               // Check if the item is added
    //               if (item.isAdded === true) {
    //                 // If filterColumn is "all", check against multiple fields
    //                 if (filterColumn === "all") {
    //                   return [
    //                     item.transaction_id,
    //                     item.description,
    //                     item.purchaseDate,
    //                     item.due_date,
    //                     item.totalPrice,
    //                     item.discount_value,
    //                   ].some((value) =>
    //                     includesSearchTerm(value, searchTerm)
    //                   );
    //                 } else {
    //                   // If filterColumn is not "all", check if the specific column includes the searchTerm
    //                   return includesSearchTerm(
    //                     item[filterColumn],
    //                     searchTerm
    //                   );
    //                 }
    //               }
    //               return false; // Return false if item.isAdded is not true
    //             })
    //             .filter(
    //               (item) =>
    //                 !payableList.map((item) => item.id).includes(item.id) // Avoid duplicate items
    //             ),
    //         ]
    //       : res.data.filter(
    //           (payable) =>
    //             !selectedTransactionIds.includes(payable.transaction_id)
    //         )
    //   );
    // }
    //     setSelectedVendorId(vendorId);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching payables:", error);
    //   });
  };

  const fetchExistingData = () => {
    axios
      .get(`${BASE_URL}/payable/getPayableBulk/${id}`)
      .then((res) => {
        const { data, dataTransaction, dataPayment, isPosted, cutoffExists } =
          res.data;
        setPayableBulk(data);
        setTransactionNumber(data?.transaction_number);
        setCurrencyRate(data?.rate);

        const modifiedTransaction = dataTransaction.map((item) => {
          let unitPrice = 0;
          // row.payable_products.forEach((data) => {
          //   unitPrice += data.product_tag_vendor.product_price * data.weight;
          // });
          item.payable.payable_products.forEach((data) => {
            unitPrice += data.unitPrice * data.weight;
          });

          const moisture = item.payable.payable_products?.reduce(
            (acc, data) => {
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
            },
            0
          );

          const totalOtherFees =
            item.payable.payable_other_fees?.reduce(
              (acc, data) => acc + parseFloat(data.fee_amount || 0),
              0
            ) || 0;

          const calculateDiscount =
            item.payable.isPercent_Discount === true
              ? (item.payable.discount_value / 100) *
                parseFloat(
                  unitPrice -
                    moisture -
                    item.payable.weighing_fee -
                    totalOtherFees
                )
              : item.payable.discount_value;

          // const totalAmountPrice =
          //   unitPrice -
          //   moisture -
          //   item.payable.weighing_fee -
          //   totalOtherFees -
          //   calculateDiscount;

          return {
            ...item,
            totalAmount: item.payable.totalPrice,
          };
        });

        setPayableList(modifiedTransaction);
        console.log(dataTransaction, "datatransaction");

        const vendorId = data.vendor_id;

        const selectedTransactionIds = dataTransaction.map(
          (item) => item.transactionId
        );

        console.log(selectedTransactionId, "transactionid");

        fetchPayableList(
          vendorId,
          module,
          searchTerm,
          filterColumn,
          payableList,
          data.currency_id,
          selectedTransactionIds,
          dataTransaction.map((item) => item.payable.id)
        );

        setSelectedRowTransactions(
          dataTransaction.map((item) => item.payable.id)
        );

        // setPaymentList(dataPayment);
        setFloatPayment(() => {
          return dataPayment.map((item) => {
            return {
              id: item.id,
              paymentMethod: item.payment_type,
              subject1:
                item.account_list_sub3.account_list_base_sub.module_type.toString(),
              subject2:
                item.account_list_sub3.account_list_base_sub_id.toString(),
              subject3: item.accountList_id.toString(),
              accountName: item.account_list_sub3.account_name,
              amountInputted: item.amount,
              issuedDate: item.date_issued,
              checkNumber: item.check_number || "",
              refNumber: item.ref_number || "",
              remarks: "",
            };
          });
        });
        setStatus(data.status);
        setPayableDate(
          data.payable_date
            ? new Date(data.payable_date).toISOString().split("T")[0]
            : ""
        );

        setIsCutoffPosted(isPosted);
        setIsCutoffExists(cutoffExists);
      })
      .catch((error) => {
        console.error("Error fetching PayableBulk:", error);
      });
  };

  useEffect(() => {
    fetchPayableList(
      selectedVendorId,
      module,
      searchTerm,
      filterColumn,
      payableList,
      payableBulk.currency_id,
      [],
      selectedRowTransactions
    );
  }, [searchTerm]);

  useEffect(() => {
    if (
      searchTerm == "" &&
      availablePayables?.some((item) => item.isAdded == true)
    ) {
      setAvailablePayables(storePreviousAvailablePayable);
    } else {
      setAvailablePayables(
        storePreviousAvailablePayable.length > 0
          ? [
              ...pagination.data.isFetch?.filter(
                (payable) =>
                  !selectedTransactionIds.includes(payable.transaction_id)
              ),
              ...storePreviousAvailablePayable
                .filter((item) => {
                  const includesSearchTerm = (str, searchTerm) => {
                    return String(str)
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase());
                  };
                  // Check if the item is added
                  if (item.isAdded === true) {
                    // If filterColumn is "all", check against multiple fields
                    if (filterColumn === "all") {
                      return [
                        item.transaction_id,
                        item.description,
                        item.purchaseDate,
                        item.due_date,
                        item.totalPrice,
                        item.discount_value,
                      ].some((value) => includesSearchTerm(value, searchTerm));
                    } else {
                      // If filterColumn is not "all", check if the specific column includes the searchTerm
                      return includesSearchTerm(item[filterColumn], searchTerm);
                    }
                  }
                  return false; // Return false if item.isAdded is not true
                })
                .filter(
                  (item) =>
                    !payableList.map((item) => item.id).includes(item.id) // Avoid duplicate items
                ),
            ]
          : pagination.data.isFetch?.filter(
              (payable) =>
                !selectedTransactionIds.includes(payable.transaction_id)
            )
      );
    }

    if (pagination?.data?.items) {
      // Skip if all selectedRows already exist in Order List Table
      const existingIds = payableList.map((item) => item.payable?.id);
      const isFullySynced =
        selectedRowTransactions.every((id) => existingIds.includes(id)) &&
        payableList.length === selectedRowTransactions.length;

      if (isFullySynced) return;

      const newItems = pagination.data.items.filter(
        (item) =>
          selectedRowTransactions.includes(item.id) &&
          !existingIds.includes(item.id)
        // pagination.data.items.includes(item.id)
      );

      if (newItems?.length > 0) {
        setPayableList((prev) => {
          const newPayables = newItems.map((item) => {
            // Find the selected payable for the current item
            const selectedPayable = pagination.data.items.find(
              (payable) => payable.transaction_id === item.transaction_id
            );
            console.log(selectedPayable, "selected payable");
            // Extract product price from payable_products
            const productPrice =
              selectedPayable?.payable_products?.[0]?.product_tag_vendor
                ?.product_price || "";
            let unitPrice = 0;
            // row.payable_products.forEach((data) => {
            //   unitPrice += data.product_tag_vendor.product_price * data.weight;
            // });
            selectedPayable.payable_products.forEach((data) => {
              unitPrice += data.unitPrice * data.weight;
            });
            const moisture = selectedPayable.payable_products?.reduce(
              (acc, data) => {
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
              },
              0
            );
            const totalOtherFees =
              selectedPayable.payable_other_fees?.reduce(
                (acc, data) => acc + parseFloat(data.fee_amount || 0),
                0
              ) || 0;
            const calculateDiscount =
              selectedPayable.isPercent_Discount === true
                ? (selectedPayable.discount_value / 100) *
                  parseFloat(
                    unitPrice -
                      moisture -
                      selectedPayable.weighing_fee -
                      totalOtherFees
                  )
                : selectedPayable.discount_value;
            const totalAmountPrice =
              unitPrice -
              moisture -
              selectedPayable.weighing_fee -
              totalOtherFees -
              calculateDiscount;
            return {
              ...item, // Preserve existing properties
              id: item.id || "",
              transactionId: item.transaction_id || "",
              invoiceDate: item.createdAt || "",
              purchaseDate: item.purchaseDate || "",
              description: item.description || "",
              dueDate: item.due_date || "",
              amount: productPrice || "",
              discount: item.discount_value || "",
              totalAmount: totalAmountPrice,
              payable: selectedPayable || null, // Attach selected payable details
              newItemList: true,
            };
          });
          return [...prev, ...newPayables];
        });
      }
    }
  }, [pagination.data.isFetch, pagination.data.items]);

  useEffect(() => {
    if (pagination.currentPage === 1 && availablePayables?.length < 10) {
      pagination.setTotalPages(
        Math.ceil(availablePayables?.length / pagination.itemsPerPage)
      );
    }
  }, [availablePayables]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  useEffect(() => {
    fetchExistingData();
    fetchCurrency();
    setCurrentDate(dateToday());
  }, []);

  useEffect(() => {
    fetchExistingData();
  }, [isEditing]);

  useEffect(() => {
    axios
      .get(BASE_URL + "/vendors/fetchVendors")
      .then((response) => {
        const mappedVendors = response.data.map((data) => ({
          value: data.id,
          label: data.company_name,
        }));
        setVendorMap(mappedVendors);
        // setSelectedTransactionId(mappedVendors[0]?.value || null);
      })
      .catch((error) => {
        console.error("Error fetching vendor:", error);
      });
  }, []);

  // useEffect(() => {
  //   const vendorId = payableBulk.vendor_id;

  //   const selectedTransactionIds = payableList.map(
  //     (item) => item.transactionId
  //   );
  //   axios
  //     // .get(`${BASE_URL}/payable/getInfobyVendor/?id=${vendorId}`)
  //     .get(`${BASE_URL}/payable/getInfobyVendor`, {
  //       params: {
  //         id: vendorId,
  //         module: module,
  //       },
  //     })
  //     .then((res) => {
  //       setAvailablePayables(
  //         res.data.filter(
  //           (payable) =>
  //             !selectedTransactionIds.includes(payable.transaction_id)
  //         )
  //       );
  //       setSelectedVendorId(vendorId);
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching payables:", error);
  //     });
  // }, []);

  const handleVendorChange = (event) => {
    const vendorId = event.target.value;
    if (vendorId) {
      // Clear the current payableList
      setPayableList([
        {
          id: "",
          transactionId: "",
          invoiceDate: "",
          dueDate: "",
          amount: "",
          discount: "",
        },
      ]);
      setBalance(0);

      axios
        .get(`${BASE_URL}/payable/getInfobyVendor/?id=${vendorId}`)
        .then((res) => {
          setAvailablePayables(res.data);
          setSelectedVendorId(vendorId);
        })
        .catch((error) => {
          console.error("Error fetching payables:", error);
        });
    }
  };

  const handleTransactionChange = (index, transactionId) => {
    const selectedPayable = availablePayables.find(
      (payable) => payable.transaction_id === transactionId
    );

    if (selectedPayable) {
      const updatedPayable = {
        ...payableList[index],
        transactionId, // Update the selected transaction ID
        payable: selectedPayable, // Add selected payable details
      };

      const updatedPayableList = [...payableList];
      updatedPayableList[index] = updatedPayable;

      console.log("Updated Payable List:", updatedPayableList); // Debug
      setPayableList(updatedPayableList);

      setAddedIds((prevIds) => [...prevIds, selectedPayable.id]);
    }
  };

  useEffect(() => {
    // Sum the "Amount" values from the Order List
    const totalOrderAmount = payableList.reduce((sum, item) => {
      const amount = parseFloat(item?.totalAmount) || 0;
      return sum + amount;
    }, 0);

    // Sum the "Amount" values from the Payment List
    const totalPaymentAmount = floatPayment.reduce((sum, payment) => {
      const amount = parseFloat(payment.amountInputted) || 0;
      return sum + amount;
    }, 0);

    // Calculate the Payable Balance
    const balance = totalOrderAmount - totalPaymentAmount;

    setBalance(balance);
    setTotalAmountSum(totalOrderAmount);
  }, [payableList]);

  const generateFilteredOptions = (index) => {
    // List all transaction IDs except those already selected
    const selectedTransactionIds = payableList
      .filter((_, i) => i !== index)
      .map((item) => item.transactionId);

    return availablePayables.filter(
      (payable) => !selectedTransactionIds.includes(payable.transaction_id)
    );
  };

  useEffect(() => {
    generateTransactionNumber();
  }, []);

  const generateTransactionNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateToday = `${year}${month}${day}`;

    let lastTransaction = localStorage.getItem(`transaction-${dateToday}`);
    // let newTransactionNumber;

    // if (lastTransaction) {
    //   const lastNumber = parseInt(lastTransaction.slice(-4));
    //   const incrementedNumber = String(lastNumber + 1).padStart(4, "0");
    //   newTransactionNumber = `${dateToday}${incrementedNumber}`;
    // } else {
    //   newTransactionNumber = `${dateToday}0001`;
    // }

    // localStorage.setItem(`transaction-${dateToday}`, newTransactionNumber);

    // setTransactionNumber("AP" + newTransactionNumber);
  };

  //*************PAYMENT METHOD***************** */
  const [selectedPayment, setSelectedPayment] = useState("Bank");
  const [onlinePaymentCheckbox, setOnlinePaymentCheckbox] = useState(false);
  const [date, setDate] = useState("");
  const [validated, setValidated] = useState(false);

  const [subject1, setSubject1] = useState("");
  const [subject2, setSubject2] = useState("");
  const [subject3, setSubject3] = useState("");

  const [subject2DataList, setSubject2DataList] = useState([]);
  const [subject3DataList, setSubject3DataList] = useState([]);
  const [isSubject2Disabled, setIsSubject2Disabled] = useState(true);
  const [isSubject3Disabled, setIsSubject3Disabled] = useState(true);

  const [totalAmountSum, setTotalAmountSum] = useState(0);
  const [bankAmount, setBankAmount] = useState(0);
  const [checkNumber, setCheckNumber] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amountInputted, setAmountInputted] = useState("0"); //amount 'to sa payment method
  const [onlineWalletRemarks, setOnlineWalletRemarks] = useState("");
  const [totalPayment, setTotalPayment] = useState(0);

  const [paymentList, setPaymentList] = useState([]);

  const [addedIds, setAddedIds] = useState([]);
  const [removeIds, setRemoveIds] = useState([]);

  console.log(removeIds, "removedIDS");

  useEffect(() => {
    if (amountInputted) {
      handleAmountValue(amountInputted);
    }
  }, [date]);

  const handlePaymentMethod = (e) => {
    const paymentMethod = e.target.value;
    setSelectedPayment(paymentMethod);
    setSubject1("");
    setSubject2("");
    setSubject3("");
  };

  const handleOnlineCheck = (e) => {
    setOnlinePaymentCheckbox(e.target.checked);
  };

  const handleSubject1Change = (event) => {
    const selectedSubject1 = event.target.value;
    let account_selected = "";

    if (selectedSubject1 === "Account-List") {
      account_selected = "Account-List";
    } else if (selectedSubject1 === "Asset Account") {
      account_selected = "Asset Account";
    } else if (selectedSubject1 === "Liabilities Account") {
      account_selected = "Liabilities Account";
    } else if (selectedSubject1 === "Owner's Equity Account") {
      account_selected = "Owner's Equity Account";
    }

    const clearSubjects = () => {
      setSubject1("");
      setSubject2("");
      setSubject3("");
      setIsSubject2Disabled(true);
      setIsSubject3Disabled(true);
    };

    try {
      axios
        .get(`${BASE_URL}/payable/getSubject1LocalPayable`, {
          params: {
            account_selected: account_selected,
            selectedPayment,
            selected_currency_id: currency,
          },
        })
        .then((res) => {
          setSubject1(selectedSubject1);
          setSubject2("");
          setSubject3("");
          setIsSubject2Disabled(false); // Enable Subject 2 after Subject 1 selection
          setIsSubject3Disabled(true); // Reset and disable Subject 3

          setSubject2DataList(res.data); //retrieve subject 2 data
        })
        .catch((error) => {
          if (error.response && error.response.status === 404) {
            swal({
              icon: "warning",
              title: "Warning",
              text: error.response.data.message,
            }).then(() => clearSubjects());
            return;
          }
          // Handle other errors
          throw error;
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

  const handleSubject2Change = (selectedOption) => {
    const selectedSubject2 = selectedOption;

    try {
      axios
        .get(`${BASE_URL}/payable/getSubject3LocalPayable`, {
          params: {
            subjectId: selectedSubject2?.value,
            totalAmountSum,
          },
        })
        .then((res) => {
          const subject3Currency = res.data.filter((item) => {
            return item.currency_id == payableBulk.currency_id;
          });
          setSubject3DataList(subject3Currency);
          setSubject2(selectedSubject2);
          setSubject3("");
          setIsSubject3Disabled(false); // Enable Subject 3 after Subject 2 selection
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

  const handleAccountChange = (selectedOption) => {
    const selectedAccountId = selectedOption?.value;
    setSubject3(selectedOption);
    const selectedAccount = subject3DataList.find(
      (account) => String(account.id) === String(selectedAccountId)
    );

    if (selectedAccount) {
      setBankAmount(selectedAccount.amount);
      setAccountName(selectedAccount.account_name);
    }
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  // const handleAmountValue = (value) => {
  //   console.log("Raw input value:", value);

  //   if (/^\d*\.?\d*$/.test(value)) {
  //     const inputValue = parseFloat(value) || 0;
  //     console.log("Parsed value:", inputValue);

  //     if (inputValue > balance && date <= currentDate) {
  //       swal({
  //         title: "Oppss!",
  //         text: "Please input not greater than the balance",
  //         icon: "error",
  //         buttons: false,
  //         timer: 2000,
  //         dangerMode: true,
  //       }).then(() => {
  //         setAmountInputted(""); // Reset input
  //       });
  //     } else {
  //       setAmountInputted(value);
  //     }
  //   }
  // };

  const handleAmountValue = (value) => {
    // Amount validation to not exceed the balance
    if (
      value !== "0" &&
      parseFloat(value.replace(/,/g, "")) > balance.toFixed(2)
    ) {
      swal({
        icon: "error",
        title: "Oppss!",
        text: "Please input not greater than the balance",
      }).then(() => {
        setAmountInputted("");
      });
    }

    if (value == ".") {
      setAmountInputted((prev) => prev + ".");
    }

    let inputValue = value.replace(/[^0-9.]/g, "");
    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    let formatAmount = inputValue.replace(/,/g, "");

    // Convert to number and format with commas
    let numericValue = parseFloat(formatAmount);

    // console.log("Formaat", formatInputValue);
    if (numericValue > balance && date <= currentDate) {
      // Check if the input value is greater than the totalAmountSum
      swal({
        title: "Oppss!",
        text: "Please input not greater than the balance",
        icon: "error",
        buttons: false,
        timer: 2000,
        dangerMode: true,
      }).then(() => {
        setAmountInputted("");
      });
    } else {
      setAmountInputted(formattedValue);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();

    let formatAmountInputted = String(amountInputted).replace(/,/g, "");

    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill the red text fields",
        buttons: false,
        timer: 2000,
      });
    } else {
      try {
        const response = await axios.post(
          `${BASE_URL}/payable/validate-issued-date`,
          {
            issuedDate: date,
          }
        );

        if (response.data.isPosted) {
          swal({
            icon: "error",
            title: "Invalid Issued Date",
            text: "The issued date falls within a posted cutoff. Please select a different date.",
            buttons: false,
            timer: 2000,
          });
          return;
        }

        // Handle Zero amount validation
        if (amountInputted == 0) {
          swal({
            icon: "warning",
            title: "Warning: Invalid Amount",
            text: "The Amount must be greater than zero to proceed",
          });
          return;
        }

        // Validate key fields
        if (!selectedPayment || !amountInputted || !date) {
          swal({
            icon: "error",
            title: "Missing Fields",
            text: "Please complete all required fields.",
            buttons: false,
            timer: 2000,
          });
          return;
        }

        swal({
          title: "Create this new payable?",
          text: "",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        }).then(async (confirmed) => {
          const isForApproval = status === "For-Approval";

          const newPayment = {
            id: null,
            paymentMethod: selectedPayment,
            subject1: subject1,
            subject2: subject2?.value,
            subject3: subject3?.value,
            accountName: accountName,
            amountInputted: parseFloat(formatAmountInputted),
            issuedDate: date,
            checkNumber: checkNumber,
            refNumber: refNumber,
            remarks: onlineWalletRemarks,
          };

          if (confirmed && isForApproval) {
            console.log("Adding Payment:", newPayment); // Debugging log

            setFloatPayment((prevPayment) => {
              if (!prevPayment || prevPayment.length === 0) {
                return [...prevPayment, newPayment];
              }

              const existingPaymentIndex = prevPayment.findIndex((item) => {
                const {
                  amountInputted: itemAmountInputted,
                  id: itemId,
                  ...itemRest
                } = item;
                const {
                  amountInputted: newPaymentAmountInputted,
                  id: newPaymentId,
                  ...newPaymentRest
                } = newPayment;
                return (
                  JSON.stringify(itemRest) === JSON.stringify(newPaymentRest)
                );
              });

              if (existingPaymentIndex !== -1) {
                return prevPayment.map((item, index) => {
                  if (index === existingPaymentIndex) {
                    return {
                      ...item,
                      amountInputted:
                        item.amountInputted + newPayment.amountInputted,
                    };
                  }
                  return item;
                });
              } else {
                return [...prevPayment, newPayment];
              }
            });

            setTotalPayment(
              (prevTotal) => prevTotal + parseFloat(formatAmountInputted)
            );

            const totalPayments = floatPayment.reduce((total, value) => {
              return total + parseFloat(value.amountInputted || 0);
            }, 0);

            setBalance(
              parseFloat(
                totalAmountSum -
                  (totalPayments + parseFloat(formatAmountInputted))
              )
            );
            swal({
              icon: "success",
              title: "Payment Added",
              text: "The new payment has been added successfully",
              buttons: false,
              timer: 2000,
            }).then(() => {
              clearPaymentFields();
            });
          }

          // Handles payment for approved payable bulk
          if (confirmed && !isForApproval) {
            try {
              const res = await axios.post(`${BASE_URL}/payable/payment`, {
                payableBulkId: id,
                newPayment,
                transactionNumber: payableBulk?.transaction_number,
                module,
              });

              if (res.status === 204) {
                swal({
                  icon: "success",
                  title: "Payment Added",
                  text: "The new payment has been added successfully",
                  buttons: false,
                  timer: 2000,
                }).then(() => {
                  clearPaymentFields();
                  fetchExistingData();
                });
              }
            } catch (error) {
              console.error(error);
            }
          }
        });
      } catch (error) {
        console.error(error);
        swal({
          icon: "error",
          title: "Server Error",
          text: "Unable to validate the issued date. Please try again later.",
          buttons: false,
          timer: 2000,
        });
      }
    }
    setValidated(true);
  };

  const clearPaymentFields = () => {
    setValidated(false);
    setOnlinePaymentCheckbox(false);

    setRefNumber("");
    setOnlineWalletRemarks("");
    setAccountName("");
    setAmountInputted(0);
    setCheckNumber("");
    setRefNumber("");
    setDate("");
    setSubject1("");
    setSubject2("");
    setSubject3("");
    setIsSubject2Disabled(true);
    setIsSubject3Disabled(true);
    setIsAmountDisabled(true);
  };

  const handleSavePayment = async () => {
    if (!payableDate) {
      swal({
        icon: "error",
        title: "Missing Transaction Date",
        text: "A transaction date is required to proceed. Please select a date before submitting.",
      });
      return;
    }

    const confirmed = await swal({
      title: "Create this new payable?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    const currentLocation = location.pathname.includes(
      "view-bulk-payable/local"
    )
      ? "Local"
      : "Overseas";

    if (confirmed) {
      try {
        const res = await axios.post(`${BASE_URL}/payable/updatePayment`, {
          id,
          payableList,
          transactionNumber,
          selectedVendorId,
          paymentList,
          floatPayment,
          balance,
          payableDate,
          subject3,
          addedIds: payableList
            .filter((item) => item.payable.isAdded !== true)
            .map((item) => item.id),
          removeIds,
          removePaymentListId: [...new Set(removePaymentListId)],
          userLoggedID,
          currentLocation,
          currencyRate,
        });

        if (res.status === 200) {
          swal({
            title: "Success",
            text: "Payable Payment has been added successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            navigate(`/purchases/view-bulk-payable/${module}/${id}`);
            setIsEditing(false);
            setTransactionToGetBack([]);
            setSelectedRow([]);
            setSelectedRowTransactions([]);
            setIdToAdd([]);
            setId(null);
            setEdit(false);
            window.onbeforeunload = null;
          });
        } else if (res.status === 201) {
          swal({
            title: "Opppss!",
            text: "Transaction Date is already posted in Cutoff. Please use other date",
            icon: "error",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          });
        }
      } catch (error) {
        console.error("Error saving payment:", error);
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        });
      }
    } else {
      setValidated(false);
    }
    setValidated(true);
  };

  console.log(payableList);

  const handleRejected = async () => {
    const confirmed = await swal({
      title: "Are you sure you want to reject this?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (confirmed) {
      try {
        const res = await axios.post(
          `${BASE_URL}/payable/bulk/approve-reject`,
          {
            id,
            payableDate,
            status: "Rejected",
            payableList,
            module,
            approvedBy: userLoggedID,
          }
        );

        if (res.status === 200) {
          swal({
            title: "Success",
            text: "Payable has been rejected successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            navigate(
              `/purchases/${
                module === "local" ? "local-purchase" : "overseas-purchase"
              }?page=${searchParams.get("page")}`
            );
          });
        }
      } catch (error) {
        console.error("Error saving payment:", error);
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        });
      }
    } else {
      setValidated(false);
    }
    setValidated(true);
  };

  const handleApproved = async () => {
    const confirmed = await swal({
      title: "Are you sure you want to approve this?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (confirmed) {
      try {
        // Get the currency info
        const currency = allCurrency.find(
          (item) => item.id === payableBulk?.currency_id
        );

        const res = await axios.post(
          `${BASE_URL}/payable/bulk/approve-reject`,
          {
            id,
            payableDate,
            status: "Approved",
            paymentList,
            floatPayment,
            payableList,
            transactionNumber: payableBulk?.transaction_number,
            module,
            approvedBy: userLoggedID,
            vendorId: payableBulk.vendor_id,
            currencyName: currency?.currency_name ?? "PHP",
            currencyRate: currency?.currency_rate ?? 1,
          }
        );

        if (res.status === 200) {
          swal({
            title: "Success",
            text: "Payable has been approved successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
            dangerMode: true,
          }).then(() => {
            navigate(
              `/purchases/local-purchase?page=${searchParams.get("page")}`
            );
          });
        }
      } catch (error) {
        console.error("Error saving payment:", error);
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          buttons: false,
          timer: 2000,
          dangerMode: true,
        });
      }
    } else {
      setValidated(false);
    }
    setValidated(true);
  };

  const [floatPayment, setFloatPayment] = useState([]);
  console.log(floatPayment);

  const handleEditTransaction = () => {
    setIsEditing(true);
    setEdit(true);
  };

  const handleCancelEditTransaction = () => {
    swal({
      title: "Are you sure?",
      text: "Your changes will not be saved.",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        const payload = JSON.stringify({ id, idToAdd: transactionToGetBack });
        const blob = new Blob([payload], { type: "application/json" });

        navigator.sendBeacon(
          `${BASE_URL}/payable/getBackOrderListTransaction`,
          blob
        );

        setSelectedRow([]);
        setSelectedRowTransactions([]);
        setIsEditing(false);
        setTransactionToGetBack([]);
        setIdToAdd([]);
        setId(null);
        setEdit(false);
        window.onbeforeunload = null;
      }
    });
  };

  const calculateTotals = () => {
    const combinedPayments = [...paymentList, ...floatPayment];

    const cashTotal = combinedPayments
      .filter(
        (data) => data.payment_type === "Cash" || data.paymentMethod === "Cash"
      )
      .reduce(
        (total, item) => total + (item.amount || item.amountInputted || 0),
        0
      );

    const accountTotal = combinedPayments
      .filter(
        (data) =>
          data.payment_type === "Online" || data.paymentMethod === "Online"
      )
      .reduce(
        (total, item) => total + (item.amount || item.amountInputted || 0),
        0
      );

    const checkTotal = combinedPayments
      .filter(
        (data) =>
          (data.payment_type === "Bank" || data.paymentMethod === "Bank") &&
          (data.check_number || data.checkNumber) !== ""
      )
      .reduce(
        (total, item) => total + (item.amount || item.amountInputted || 0),
        0
      );

    return {
      cashTotal,
      accountTotal,
      checkTotal,
    };
  };

  const { cashTotal, accountTotal, checkTotal } = calculateTotals();

  if (isEditing === true) {
    window.onbeforeunload = (e) => {
      e.preventDefault();
      const payload = JSON.stringify({ id, idToAdd: transactionToGetBack });
      const blob = new Blob([payload], { type: "application/json" });

      navigator.sendBeacon(
        `${BASE_URL}/payable/getBackOrderListTransaction`,
        blob
      );

      setIsEditing(false);
      window.onbeforeunload = null; // To clean up the event listener
      return "";
    };
  }

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

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ label, value, onClick, generateYears, index }, ref) => (
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

          generateYears(date); // Reset/Initialize Year List based on selected date
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required
        disabled={label === "Transaction Date" ? !isEditing : isInputDisabled}
      />
    )
  );

  // function to handle currency rate formatting
  const handleCurrencyRateChange = (e) => {
    let inputValue = e.target.value.replace(/[^0-9.]/g, "");
    if ((inputValue.match(/\./g) || []).length > 1) return;
    let [integerPart, decimalPart] = inputValue.split(".");
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setCurrencyRate(formattedValue);
  };

  return (
    <div>
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="w-100 d-flex flex-row justify-content-between">
          <span className="fs-3">
            <Link to={`/purchases/local-purchase`} className="text-dark mx-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            NEW PAYABLE
          </span>
          {authrztn.includes("LocalPurchase-Edit") && (
            <div className="dropdown dropdown-button">
              <button
                className="border-0"
                type="button"
                id="dropdownMenuButton1"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bx bx-dots-horizontal fs-4"></i>
              </button>
              <ul
                className="dropdown-menu"
                aria-labelledby="dropdownMenuButton1"
              >
                <li>
                  <span
                    style={{
                      cursor:
                        status === "For-Approval" ? "pointer" : "not-allowed",
                      color: status === "For-Approval" ? "inherit" : "gray",
                    }}
                    className="dropdown-item"
                    onClick={
                      status === "For-Approval" ? handleEditTransaction : null
                    }
                  >
                    Edit Transaction
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="container-fluid mt-3">
        <div className="row p-2">
          <div className="col-sm">
            <span>Transaction Number</span>
            <input
              type="text"
              name=""
              id=""
              value={payableBulk?.transaction_number || ""}
              className="form-control p-2"
              readOnly
            />
          </div>
          <div className="col-sm"></div>
        </div>
        <div className="row p-2">
          <div className="col-sm">
            <span>Vendor</span>
            <div className="input-group mb-2">
              <Form.Select
                className="form-control p-2"
                required
                disabled
                value={payableBulk.vendor_id}
              >
                <option disabled selected value="">
                  Select Vendor
                </option>
                {vendorMap.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
          <div className="col-sm">
            <span>Currency</span>
            <div className="input-group mb-2">
              <Form.Select
                className="form-select p-2"
                required
                disabled
                value={payableBulk.currency_id}
              >
                <option disabled selected value="">
                  Select Currency
                </option>
                {allCurrency.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.currency_name}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
          {payableBulk.currency_id &&
          payableBulk.currency_id !== "11111111-1111-1111-1111-111111111111" ? (
            <div className="col-sm">
              <span>Currency Rate</span>
              <Form.Control
                type="text"
                name=""
                id=""
                className="form-control p-2"
                required
                onChange={handleCurrencyRateChange}
                value={currencyRate}
                disabled={!isEditing}
              />
            </div>
          ) : (
            <div className="col-sm">
              <span>Total Payable</span>
              <div className="input-group mb-2">
                <div className="input-group-prepend">
                  <div className="input-group-text h-100">₱</div>
                </div>
                <input
                  type="text"
                  className="form-control p-2"
                  id="inlineFormInputGroup"
                  value={totalAmountSum.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  readOnly
                />
              </div>
            </div>
          )}
          <input type="hidden" value={status} />
          <div className="col-sm">
            <span>Transaction Date</span>
            <CustomDatePicker
              label={"Transaction Date"}
              selected={payableDate ? new Date(payableDate) : ""}
              handleDateChange={(date) => {
                const args = [date, setPayableDate, "Transaction Date"];
                setPayableDate(date);
                dateValidation(...args);
                postedCutoffValidation(...args);
              }}
              setter={setPayableDate}
              CustomInput={CustomInput}
              isRequired={true}
              validated={validated}
              disabled={isInputDisabled}
              dateValidation={dateValidation}
              postedCutoffValidation={postedCutoffValidation}
            />
          </div>
        </div>
        {payableBulk.currency_id &&
        payableBulk.currency_id !== "11111111-1111-1111-1111-111111111111" ? (
          <div className="row p-2">
            <div className="col-sm">
              <span>Total Payable</span>
              <div className="input-group mb-2">
                <div className="input-group-prepend">
                  <div className="input-group-text h-100">₱</div>
                </div>
                <input
                  type="text"
                  className="form-control p-2"
                  id="inlineFormInputGroup"
                  value={totalAmountSum.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  readOnly
                />
              </div>
            </div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
          </div>
        ) : null}
      </div>
      <div className="container-fluid ">
        <div className="w-100 d-flex align-items-center mt-3 p-2">
          <h5>Order List</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="w-100 mt-2 p-2 new-item-custom scrollable-contents ">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th className="p-2">Transactions ID</th>
                  <th className="p-2">Remarks</th>
                  <th className="p-2">Purchase Date</th>
                  <th className="p-2">Due Date</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Discount</th>
                  {isEditing && <th className="p-2">Action</th>}
                </tr>
              </thead>
              <tbody>
                {payableList.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        className="form-control"
                        value={item?.payable?.transaction_id || ""}
                        type="text"
                        readOnly
                      />
                    </td>
                    <td>
                      {/* {item.newItemList ? (
                        <select
                          className="form-select"
                          value={item?.payable?.description || ""}
                          onChange={(e) =>
                            handleTransactionChange(index, e.target.value)
                          }
                        >
                          <option value="" disabled>
                            Select Remarks
                          </option>
                          {generateFilteredOptions(index).map((payable) => (
                            <option
                              key={payable.id}
                              value={payable.transaction_id}
                            >
                              {payable?.description}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="form-control"
                          type="text"
                          readOnly
                          value={item?.payable?.description || ""}
                        />
                      )} */}
                      <input
                        className="form-control"
                        type="text"
                        readOnly
                        value={item?.payable?.description || ""}
                      />
                    </td>
                    <td>
                      {/* <input
                        className="form-control"
                        value={
                          item?.payable?.createdAt
                            ? new Date(item?.payable?.createdAt)
                                .toISOString()
                                .split("T")[0]
                            : "" || ""
                        }
                        type="text"
                        readOnly
                      /> */}
                      <DatePicker
                        selected={item?.payable?.createdAt}
                        dateFormat="MMM/dd/yyyy"
                        className="form-control p-2"
                        readOnly
                      />
                    </td>
                    <td>
                      {/* <input
                        className="form-control"
                        value={
                          item?.payable?.due_date
                            ? new Date(item?.payable?.due_date)
                                .toISOString()
                                .split("T")[0]
                            : "" || ""
                        }
                        type="text"
                        readOnly
                      /> */}
                      <DatePicker
                        selected={item?.payable?.due_date}
                        dateFormat="MMM/dd/yyyy"
                        className="form-control p-2"
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={
                          item?.totalAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || ""
                        }
                        type="text"
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={item?.payable?.discount_value || ""}
                        type="text"
                        readOnly
                      />
                    </td>
                    {isEditing && (
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteItem(item, index)}
                          disabled={
                            payableList.length <= 1 ||
                            (payableList.length > 1 &&
                              !payableList[1].payable?.id)
                          }
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-100 d-flex justify-content-end mt-2">
          {isEditing && (
            <button className="btn btn-primary btn-sm" onClick={addNewItem}>
              New Item
            </button>
          )}
        </div>
      </div>
      <div className="container-fluid mt-4">
        <div className="w-100 d-flex align-items-center mt-3 p-2">
          <h5>Payment</h5>
          <hr className="flex-grow-1 mx-3" />
        </div>
        <div className="w-100 mt-4">
          <div className="w-100 p-2 mt-1 row">
            <div className="col-12 col-md-4 p-2">
              <div className="w-100 border shadow-sm p-3 rounded">
                <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                  <span className="fw-bold">Payment Method</span>
                </div>
                <Form validated={validated} onSubmit={handleAddPayment}>
                  <Form.Group className="mb-3" controlId="payWith">
                    <Form.Label className="fw-bold">Pay With:</Form.Label>
                    <div className="d-flex">
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="bank"
                        label="Bank"
                        value="Bank"
                        disabled={isInputDisabled}
                        checked={selectedPayment === "Bank"}
                        onChange={handlePaymentMethod}
                        className="me-3"
                      />
                      <Form.Check
                        type="radio"
                        name="paymentType"
                        id="cash"
                        label="Cash"
                        disabled={isInputDisabled}
                        value="Cash"
                        checked={selectedPayment === "Cash"}
                        onChange={handlePaymentMethod}
                        className="me-3"
                      />
                    </div>
                    <div className="mt-2">
                      <input
                        type="checkbox"
                        disabled={isInputDisabled}
                        checked={onlinePaymentCheckbox}
                        onChange={handleOnlineCheck}
                      />{" "}
                      <label>Online</label>
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Subject 1</Form.Label>
                    <Form.Select
                      className="form-select"
                      onChange={handleSubject1Change}
                      value={subject1}
                      required
                      disabled={isInputDisabled}
                    >
                      <option value="" selected disabled>
                        Select Subject 1
                      </option>
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
                      <option value="" selected disabled>
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
                    </Form.Select> */}
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
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="accountName">
                    <Form.Label className="fw-bold">Accounts</Form.Label>
                    {/* <Form.Select
                      value={subject3}
                      className="p-2"
                      onChange={handleAccountChange}
                      required={selectedPayment !== "Online"}
                      disabled={isSubject3Disabled}
                    >
                      <option value="" disabled>
                        Select Account name
                      </option>
                      {subject3DataList.map((data) => (
                        <option key={data.id} value={data.id}>
                          {data.account_name}
                        </option>
                      ))}
                    </Form.Select> */}
                    <Select
                      options={subject3Options}
                      value={subject3}
                      onChange={handleAccountChange}
                      placeholder={`Select Account name`}
                      styles={selectCustomStyles(subject3, validated)}
                      isDisabled={isSubject3Disabled}
                      required={selectedPayment !== "Online"}
                      isSearchable
                    />
                  </Form.Group>

                  {selectedPayment === "Bank" && !onlinePaymentCheckbox && (
                    <Form.Group className="mb-3" controlId="checkNumber">
                      <Form.Label>Check #</Form.Label>
                      <Form.Control
                        type="text"
                        className="p-2"
                        readOnly={isInputDisabled}
                        placeholder="000000-000-0000"
                        value={checkNumber}
                        maxLength={15}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 15) {
                            setCheckNumber(value);
                          }
                        }}
                      />
                    </Form.Group>
                  )}

                  {onlinePaymentCheckbox && (
                    <Form.Group className="mb-3" controlId="checkNumber">
                      <Form.Label>Reference #</Form.Label>
                      <Form.Control
                        type="text"
                        className="p-2"
                        readOnly={isInputDisabled}
                        placeholder="000000-000-0000"
                        value={refNumber}
                        onChange={(e) => setRefNumber(e.target.value)}
                      />
                    </Form.Group>
                  )}

                  {onlinePaymentCheckbox && (
                    <Form.Group className="mb-3" controlId="online">
                      <Form.Label>Online Wallet Remarks</Form.Label>
                      <Form.Control
                        type="text"
                        className="p-2"
                        readOnly={isInputDisabled}
                        value={onlineWalletRemarks}
                        placeholder="Description"
                        onChange={(e) => setOnlineWalletRemarks(e.target.value)}
                      />
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3" controlId="date">
                    <Form.Label>Issued Date</Form.Label>
                    <div className="position-relative">
                      {/* <DatePicker
                        selected={date}
                        dateFormat="MMM/dd/yyyy"
                        onChange={(date) => {
                          setDate(date);
                          setIsAmountDisabled(false);
                        }}
                        className="form-control p-2"
                        customInput={<CustomInput />}
                      /> */}
                      <CustomDatePicker
                        label={"Issued Date"}
                        selected={date ? new Date(date) : ""}
                        handleDateChange={(date) => {
                          const args = [date, setDate, "Issued Date"]; // prettier-ignore
                          setDate(date);
                          setIsAmountDisabled(false);
                          dateValidation(...args);
                          postedCutoffValidation(...args);
                        }}
                        setter={setDate}
                        CustomInput={CustomInput}
                        isRequired={true}
                        validated={validated}
                        disabled={isInputDisabled}
                        dateValidation={dateValidation}
                        postedCutoffValidation={postedCutoffValidation}
                      />
                      <i
                        class="fa-solid fa-calendar-week calendar-position"
                        style={{
                          right: `${validated ? "2rem" : "1rem"}`,
                          top: "0.8rem",
                        }}
                      ></i>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="amount">
                    <Form.Label>Amount</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">₱</span>
                      <Form.Control
                        type="text"
                        className="p-2"
                        required
                        placeholder="0.00"
                        readOnly={isAmountDisabled}
                        value={amountInputted}
                        onInput={onInputFloat}
                        onChange={(e) => handleAmountValue(e.target.value)}
                      />
                    </div>
                    <span>
                      Account Balance:{" "}
                      <strong>
                        {bankAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>
                    </span>
                  </Form.Group>

                  <Button
                    type="submit"
                    disabled={
                      parseFloat(balance) === 0 ||
                      (parseFloat(balance) === 0 && !isEditing) ||
                      (status === "For-Approval" && !isEditing)
                    }
                    variant="primary"
                    className="w-100 p-2"
                  >
                    Add Payment
                  </Button>
                </Form>
              </div>
            </div>
            <div className="col-12 col-md-8 p-2 d-flex flex-column">
              <div className="w-100 border shadow-sm p-2 rounded mb-2">
                <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                  <span className="fw-bold">Payment List</span>
                </div>
                <div className="mt-3">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead>
                        <tr>
                          <th className="p-2">Type</th>
                          <th className="p-2">Account Name</th>
                          <th className="p-2">Amount</th>
                          <th className="p-2">Check Number</th>
                          <th className="p-2">Ref Number</th>
                          <th className="p-2">Issue Date</th>
                          {isEditing && <th className="p-2">Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {/* {paymentList.map((data, i) => (
                          <tr>
                            <td>{data.payment_type}</td>
                            <td>
                              {data.accountList_id === ""
                                ? "--"
                                : data.account_list_sub3.account_name}
                            </td>
                            <td>
                              {typeof data.amount === "number"
                                ? data.amount.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : "--"}
                            </td>
                            <td>
                              {data.check_number === ""
                                ? "--"
                                : data.check_number}
                            </td>
                            <td>
                              {data.ref_number === "" ? "--" : data.ref_number}
                            </td>
                            <td>{data.date_issued}</td>
                          </tr>
                        ))} */}

                        {floatPayment.map((data, i) => (
                          <tr>
                            <td>{data.paymentMethod}</td>
                            <td>
                              {data.accountList_id === ""
                                ? "--"
                                : data.accountName}
                            </td>
                            <td>
                              {typeof data.amountInputted === "number"
                                ? data.amountInputted.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : "--"}
                            </td>
                            <td>
                              {data.checkNumber === null || ""
                                ? "--"
                                : data.checkNumber}
                            </td>
                            <td>
                              {data.refNumber === null || ""
                                ? "--"
                                : data.refNumber}
                            </td>
                            <td>{format(data.issuedDate, "MMM/dd/yyyy")}</td>
                            {isEditing && (
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deletePayment(data, i)}
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="w-100 border shadow-sm p-2 rounded ">
                <div className="w-100 d-flex flex-column payment-card border-bottom pb-2 mb-3">
                  <span className="fw-bold">Balance Details</span>
                </div>
                <div className="row">
                  <div className="col-sm mb-2">
                    <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                      <span className="text-white">Payable Balance</span>
                      <span className="text-white text-underline">
                        {" "}
                        {Math.max(
                          0,
                          parseFloat(
                            balance.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          )
                        ) == 0
                          ? "0.00"
                          : parseFloat(balance).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                      </span>
                    </div>
                  </div>
                  <div className="col-sm"></div>
                  <div className="col-sm mb-2">
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Cash</span>
                      <span className="text-secondary">
                        {cashTotal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Online</span>
                      <span className="text-secondary">
                        {accountTotal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-2">
                      <span>Check</span>
                      <span className="text-secondary">
                        {checkTotal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="w-100 d-flex flex-row justify-content-between p-3 mt-3 total-amount-container align-items-center rounded">
                      <span className="text-white">Total Payment</span>
                      <span className="text-white text-underline">
                        {" "}
                        ₱
                        {[
                          ...paymentList.map((p) => parseFloat(p.amount) || 0),
                          ...floatPayment.map(
                            (f) => parseFloat(f.amountInputted) || 0
                          ),
                        ]
                          .reduce((total, amount) => total + amount, 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row mt-4">
                <div className="col-sm"></div>
                <div className="col-sm"></div>
                <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                  {isEditing ? (
                    <>
                      <button
                        className="btn btn-outline-secondary w-100 me-3"
                        onClick={handleCancelEditTransaction}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary w-100"
                        type="button"
                        onClick={handleSavePayment}
                      >
                        Update
                      </button>
                    </>
                  ) : (
                    <>
                      {authrztn.includes("LocalPurchase-Approve") &&
                        status === "For-Approval" && (
                          <>
                            <div className="d-flex flex-column gap-2">
                              <div className="d-flex">
                                <button
                                  className="btn btn-danger w-100 px-3 me-3"
                                  type="button"
                                  onClick={handleRejected}
                                  disabled={isCutoffPosted || !isCutoffExists}
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-success w-100 px-3"
                                  onClick={handleApproved}
                                  disabled={isCutoffPosted || !isCutoffExists}
                                  // disabled={
                                  //   Math.max(
                                  //     0,
                                  //     parseFloat(totalAmountSum.toFixed(2))
                                  //   ) !==
                                  //     parseFloat(
                                  //       [
                                  //         ...paymentList.map(
                                  //           (p) => parseFloat(p.amount) || 0
                                  //         ),
                                  //         ...floatPayment.map(
                                  //           (f) =>
                                  //             parseFloat(f.amountInputted) || 0
                                  //         ),
                                  //       ]
                                  //         .reduce(
                                  //           (total, amount) => total + amount,
                                  //           0
                                  //         )
                                  //         .toFixed(2)
                                  //     ) || isCutoffPosted
                                  // }
                                >
                                  Approve
                                </button>
                              </div>
                              <div>
                                {/* {Math.max(
                                  0,
                                  parseFloat(totalAmountSum.toFixed(2))
                                ) !==
                                  parseFloat(
                                    [
                                      ...paymentList.map(
                                        (p) => parseFloat(p.amount) || 0
                                      ),
                                      ...floatPayment.map(
                                        (f) => parseFloat(f.amountInputted) || 0
                                      ),
                                    ]
                                      .reduce(
                                        (total, amount) => total + amount,
                                        0
                                      )
                                      .toFixed(2)
                                  ) && (
                                  <span
                                    className={`text-danger ${
                                      isCutoffPosted && "d-none"
                                    }`}
                                    style={{
                                      fontSize: "0.9rem",
                                    }}
                                  >
                                    Please Complete the Payment Before
                                    Proceeding.
                                  </span>
                                )} */}
                                <div>
                                  {(authrztn.includes("LocalPurchase-Edit") ||
                                    authrztn.includes(
                                      "LocalPurchase-Approve"
                                    )) &&
                                    isCutoffPosted && (
                                      <div>
                                        <p className="text-danger">
                                          Action is prohibited as the Purchase
                                          date has already been posted.
                                        </p>
                                      </div>
                                    )}

                                  {(authrztn.includes("LocalPurchase-Edit") ||
                                    authrztn.includes(
                                      "LocalPurchase-Approve"
                                    )) &&
                                    !isCutoffExists && (
                                      <div>
                                        <p className="text-danger">
                                          Action is prohibited as the Purchase
                                          date has not been created.
                                        </p>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={show}
        size="xl"
        onHide={() => {
          setFilterColumn("all");
          setSearchTerm("");
          handleClose();
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Payable List</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => {
                  let input = e.target.value;

                  // Remove commas
                  const raw = String(input).replace(/,/g, "");

                  const [intPart, decimalPart] = raw.split(".");

                  // Add commas to integer part
                  const withCommas = intPart.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ","
                  );

                  // Join back decimal part if it exists
                  const formatted =
                    decimalPart !== undefined
                      ? `${withCommas}.${decimalPart}`
                      : withCommas;

                  if (
                    availablePayables.find((item) => {
                      const price = item.totalPrice;
                      const precision17 = Number(
                        price.toPrecision(17)
                      ).toString();
                      const fixed17 = price.toFixed(17);
                      const fixed2 = price.toFixed(2);

                      return (
                        precision17.includes(raw) ||
                        fixed17.includes(raw) ||
                        fixed2.includes(raw)
                      );
                    })
                  ) {
                    setSearchTerm(formatted);
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
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
                  { value: "transaction_id", label: "Transaction ID" },
                  { value: "description", label: "Remarks" },
                  { value: "purchaseDate", label: "Purchase Date" },
                  { value: "due_date", label: "Due Date" },
                  { value: "totalPrice", label: "Amount" },
                  { value: "discount_value", label: "Discount" },
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
          <DataTable
            columns={modalColumn}
            data={availablePayables}
            customStyles={customStyles}
            className="dataTable"
          />
          <PaginationControls {...pagination} />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setFilterColumn("all");
              setSearchTerm("");
              handleClose();
            }}
          >
            Close
          </Button>
          <Button variant="primary" onClick={submitModal}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NEW_view_bulk_payable;
