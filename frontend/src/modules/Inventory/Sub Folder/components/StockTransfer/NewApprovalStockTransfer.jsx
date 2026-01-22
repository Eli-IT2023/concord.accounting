import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../../../assets/global/url";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../../assets/table-style";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import useDecodeToken from "../../../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { useServerPagination } from "../../../../../hooks/customHook/paginationHook/useServerPagination";
import {
  PaginationControls,
  usePagination,
} from "../../../../../hooks/customHook/paginationHook/usePagination";
import { useDateValidation } from "../../../../../hooks/customHook/useDateValidation";
import CustomDatePicker from "../../../../../components/CustomDatePicker";

const NewApprovalStockTransfer = () => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const { id } = useParams();
  const isFetchedRef = useRef(false);
  const [countingDate, setCountingDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Validations
  const { dateValidation } = useDateValidation();
  const [validated, setValidated] = useState(false);

  const [showModal, setShowModal] = useState(false);

  // For warehouse states
  const [warehouseList, setWarehouseList] = useState([]);
  const [warehouseList_TO, setWarehouseList_TO] = useState([]);
  const [warehouseFrom_id, setWarehouseFrom_id] = useState("");
  const [warehouseTo_id, setWarehouseTo_id] = useState("");

  const [selectedRows, setSelectedRows] = useState([]); // Already selected and submitted rows
  const [draftedRows, setDraftedRows] = useState([]); // Unconfirmed state, or temporary rows
  const [allItems, setAllItems] = useState({}); // Used for validation on invalid quantity for quantity to transfer
  const productsToTransfer = useRef(new Map()); // Stores products to transfer, send in backend

  const [transactionId, setTransactionId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("");

  const [isEdited, setIsEdited] = useState(false);
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);

  // For search filter
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const debounceTimer = useRef(null);

  // For fetchings
  const productListModalPagination = useServerPagination("about:blank", 10);
  const productListPagination = useServerPagination("about:blank", 10);
  const stockTransferEndpoint = `${BASE_URL}/stock_transfer`;

  // Helper: format number to 2 decimal places
  const formatToTwoDecimal = (num) => {
    const value = num ?? 0;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get the item list table
  const getProductList = (productIdList, warehouseId) => {
    productListPagination.updateHttpMethod("POST");
    productListPagination.updateApiUrl(
      `${stockTransferEndpoint}/products/summary`
    );
    productListPagination.updateParams({
      warehouseId: warehouseId || warehouseFrom_id,
      productList: productIdList?.map((id) => `'${id}'`) || [],
    });
  };

  // Get the modal's table
  const getProductListModal = () => {
    productListModalPagination.updateHttpMethod("POST");
    productListModalPagination.updateApiUrl(
      `${stockTransferEndpoint}/products/summary/selectable`
    );
    productListModalPagination.updateParams({
      warehouseId: warehouseFrom_id,
      productList: selectedRows?.map((id) => `'${id}'`) || [],
    });
  };

  // Handle search change
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      productListModalPagination.updateHttpMethod("POST");
      productListModalPagination.updateApiUrl(
        `${stockTransferEndpoint}/products/summary/selectable/search`
      );
      productListModalPagination.updateParams({
        warehouseId: warehouseFrom_id,
        productList: selectedRows?.map((id) => `'${id}'`) || [],
        searchText: value,
        filterColumn,
      });
    }, 500);
  };

  // Handle show modal
  const handleShow = () => {
    setShowModal(true);
  };

  // Handle close modal
  const handleClose = () => {
    setShowModal(false);
    setFilterColumn("all");
    setSearchText("");
    setDraftedRows([]);
  };

  // Handle change quantity to transfer
  const handleQuantityToTransfer = (eValue, row) => {
    const value = eValue;
    const formattedAmount = parseFloat(String(eValue).replace(/,/g, ""));

    if (eValue && formattedAmount > row.stock_quantity) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("center-swal-text");
      wrapper.innerHTML = `The quantity you entered: <strong>${formattedAmount}</strong>, 
      exceeds the Available stock <strong>(${row.stock_quantity})</strong>. Please reduce the amount and try again.`;
      swal({
        icon: "error",
        title: "Stock Limit Exceeded",
        content: wrapper,
      });

      return;
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

    if (numericValue > row.available) {
      let stringRowAvailable = String(row.available).replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      );

      inputValue = stringRowAvailable;
    }

    const cleanedValue = formattedValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma

    // Set quantity to transfer for table display
    productListPagination.setData((prevList) =>
      prevList.map((item) =>
        item.product_id === row.product_id
          ? { ...item, quantity_to_transfer: cleanedValue }
          : item
      )
    );

    // Set quantity to transfer for data to be passed in backend
    productsToTransfer.current.set(row.product_id, {
      productId: row.product_id,
      available: row.stock_quantity,
      quantity_to_transfer: cleanedValue,
      average_price: row.average_price,
    });

    // Update the quantity for the specific productId
    setAllItems((prev) => ({
      ...prev,
      [row.product_id]: cleanedValue,
    }));
  };

  // Helper: array filter by productId
  const removeId = (array, productId) => {
    return array.filter((id) => id !== productId);
  };

  // Handle table item removal
  const handleRemoveItem = (productId) => {
    productsToTransfer.current.delete(productId); // update products to transfer

    // Update table fetching
    getProductList(removeId(selectedRows, productId));
    setSelectedRows((prev) => removeId(prev, productId));
  };

  // Handle individual checkbox change
  const handleSelectRow = (productId) => {
    // Unselect one row
    if (draftedRows.includes(productId)) {
      const unselectRow = (prev) => removeId(prev, productId);
      setDraftedRows(unselectRow);
      // Select one row
    } else {
      const selectRow = (prev) => [...prev, productId];
      setDraftedRows(selectRow);
    }
  };

  // Handle select all row on the current page
  const handleSelectAllRows = (isChecked) => {
    const data = productListModalPagination.data;
    const newSelectedRows = data.map((item) => item.product_id);

    // If checked add all row on the current page
    if (isChecked) {
      const addNewRows = (prev) => [...prev, ...newSelectedRows];
      setDraftedRows(addNewRows);
    }

    // If unchecked remove all row on the current page
    if (!isChecked) {
      const removeRows = (prev) =>
        prev.filter((id) => !newSelectedRows.includes(id));
      setDraftedRows(removeRows);
    }
  };

  // Get the warehouses "from"
  const fetchWarehouseList_FROM = () => {
    axios
      .get(BASE_URL + "/warehouse/getWarehouse")
      .then((res) => {
        setWarehouseList(res.data);
      })
      .catch((err) => console.log(err));
  };

  // Get the warehouses "to"
  const fetchWarehouseList_TO = (warehouseFrom_id) => {
    axios
      .get(BASE_URL + "/stock_transfer/getWarehouseTo", {
        params: {
          warehouse_id: warehouseFrom_id,
        },
      })
      .then((res) => {
        setWarehouseList_TO(res.data);
      })
      .catch((err) => console.log(err));
  };

  // Get the stock transfer transaction for editing
  const fetchTransactionData = async () => {
    axios
      .get(BASE_URL + "/stock_transfer/getDataCreated", {
        params: {
          stock_transfer_id: id,
        },
      })
      .then((res) => {
        const stockTransferProducts = res.data.stock_transfer_products;
        setTransactionId(res.data.transaction_id);
        setCountingDate(res.data.date_transfer);
        setWarehouseFrom_id(res.data.warehouse_from_id);
        setWarehouseTo_id(res.data.warehouse_to_id);
        setRemarks(res.data.description);
        setStatus(res.data.status);
        setIsCutoffPosted(res.data.isPosted);

        fetchWarehouseList_TO(res.data.warehouse_from_id);

        // Create an array of items to update the state in one go
        const newItemList = stockTransferProducts.map((item) => ({
          stock_transfer_product_id: item.id,
          productId: item.product_id,
          productCode: item.product_list.product_code,
          productName: item.product_list.product_name,
          available: item.available_quantity,
          quantity_to_transfer: item.quantity_to_transfer,
        }));

        // Initialize the productsToTransfer with the existing stock transfer products
        for (const row of stockTransferProducts) {
          productsToTransfer.current.set(row.product_id, {
            stock_transfer_product_id: row.id,
            productId: row.product_id,
            available: row.available_quantity,
            quantity_to_transfer: row.quantity_to_transfer,
            average_price: 0,
            from_stock_transfer: true,
          });
        }

        // Initialize the Item list table with the existing stock transfer products
        getProductList(
          newItemList.map((item) => item.productId),
          res.data.warehouse_from_id
        );

        // Initialize selected rows with the existing stock transfer products
        setSelectedRows(stockTransferProducts.map((item) => item.product_id));

        const productIdAndQuantity = stockTransferProducts.map((item) => ({
          id: item.product_id,
          quantity: item.quantity_to_transfer,
        }));

        // Initialize items
        const initializeItems = productIdAndQuantity.reduce(
          (acc, item) => ({ ...acc, [item.id]: item.quantity }),
          {}
        );

        setAllItems((prev) => ({
          ...prev,
          ...initializeItems,
        }));
      })
      .catch((err) => console.log(err));
  };

  // Handle modal submission
  const handleSubmitModal = () => {
    const initializeItems = draftedRows.reduce(
      (acc, id) => ({ ...acc, [id]: "0" }),
      {}
    );

    setAllItems((prev) => ({
      ...prev,
      ...initializeItems,
    }));
    getProductList(
      [...new Set([...draftedRows, ...selectedRows])],
      warehouseFrom_id
    ); // Update Item List table fetching
    setSelectedRows((prev) => [...prev, ...draftedRows]);
    setShowModal(false);
    setSearchText("");
    setDraftedRows([]); // Clear drafted rows
  };

  // Handle update stock transfer transaction
  const updateStockTransfer = async (e) => {
    e.preventDefault();
    setValidated(true);
    const form = e.currentTarget;

    const itemsToTransfer = Array.from(productsToTransfer.current.values());

    const formattedItemList = itemsToTransfer.map((item) => ({
      ...item,
      quantity_to_transfer: parseFloat(
        String(item.quantity_to_transfer).replace(/,/g, "")
      ),
    }));

    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();

      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill the red text fields",
      });
    } else {
      if (
        formattedItemList.some(
          (item) => item.quantity_to_transfer > item.available
        )
      ) {
        swal({
          icon: "error",
          title: "Please check the quantity to transfer",
          text: "The quantity to transfer is greater than the available quantity",
        }).then(() => {
          return;
        });
      }

      // Handle 0 quantity as Invalid input for "Quantity to transfer"
      if (Object.entries(allItems).some(([_, item]) => item == 0)) {
        swal({
          icon: "error",
          title: "Invalid Quantity",
          text: "Quantity to transfer must be greater than zero",
          button: "OK",
        });
        return;
      }

      if (productListPagination.data.length === 0) {
        swal({
          icon: "warning",
          title: "No item Added",
          text: "Please add item to proceed with the stock transfer.",
        }).then(() => {
          return;
        });
      } else {
        swal({
          icon: "warning",
          title: "Warning",
          text: "Are you sure you want to update this stock transfer?",
          buttons: ["Cancel", "Confirm"],
        }).then((yes) => {
          if (yes) {
            axios
              .post(BASE_URL + "/stock_transfer/updateStockTransfer", null, {
                params: {
                  countingDate: countingDate,
                  remarks: remarks,
                  warehouseFrom_id: warehouseFrom_id,
                  warehouseTo_id: warehouseTo_id,
                  transactionId: transactionId,
                  itemProductToTransfer: formattedItemList,
                  stock_transfer_id: id,
                  userLoggedID,
                },
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    title: "Success",
                    text: "Stock Transfer updated successfully!",
                    icon: "success",
                    button: "OK",
                  }).then(() => {
                    navigate("/inventory/stock-transfer");
                  });
                } else {
                  ErrorInserted();
                }
              });
          }
        });
      }
    }
  };

  const ErrorInserted = () => {
    swal({
      title: "Something went wrong",
      text: "Please Contact your support immediately",
      icon: "error",
      button: "OK",
      dangerMode: true,
    });
  };

  // Handle approve stock transfer transaction
  const handleApprove = () => {
    swal({
      icon: "warning",
      title: "Warning",
      text: "Are you sure you want to approve this stock transfer?",
      buttons: ["Cancel", "Confirm"],
    }).then((yes) => {
      if (yes) {
        try {
          axios
            .post(BASE_URL + "/stock_transfer/approveStockTransfer", null, {
              params: {
                stock_transfer_id: id,
                transactionId: transactionId,
                itemProductToTransfer: Array.from(
                  productsToTransfer.current.values()
                ),
                warehouse_from_id: warehouseFrom_id,
                warehouse_to_id: warehouseTo_id,
                userLoggedID,
                countingDate,
              },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Success Stock Transfer!",
                  icon: "success",
                  button: "OK",
                }).then(() => {
                  navigate("/inventory/stock-transfer");
                });
              } else if (res.status === 201) {
                const title = document.createElement("div");
                const text = document.createElement("div");
                const swalInfo = document.createElement("div");

                title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Opppss!</div>`;
                text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                              ${res.data.message}
                            </div>`;

                swalInfo.append(title);
                swalInfo.append(text);
                swal({
                  icon: "error",
                  content: swalInfo,
                });
              }
            });
        } catch (error) {
          console.log(error);
        }
      }
    });
  };

  // Handle reject stock transfer transaction
  const handleReject = () => {
    swal({
      icon: "warning",
      title: "Warning",
      text: "Are you sure you want to reject this stock transfer?",
      buttons: ["Cancel", "Confirm"],
    }).then((yes) => {
      if (yes) {
        try {
          axios
            .post(BASE_URL + "/stock_transfer/rejectStockTransfer", null, {
              params: {
                stock_transfer_id: id,
                itemProductToTransfer: Array.from(
                  productsToTransfer.current.values()
                ),
                warehouse_from_id: warehouseFrom_id,
                warehouse_to_id: warehouseTo_id,
                userLoggedID,
                transactionId,
              },
            })
            .then((res) => {
              console.log(res);

              swal({
                title: "Reject",
                text: "Rejecting Stock Transfer!",
                icon: "success",
                button: "OK",
              }).then(() => {
                navigate("/inventory/stock-transfer");
              });
            });
        } catch (error) {
          console.log(error);
        }
      }
    });
  };

  // Item List columns (Outside table)
  const columns = [
    { name: "Product Code", selector: (row) => row.product_code },
    { name: "Product Name", selector: (row) => row.product_name },
    {
      name: "Available",
      selector: (row) => formatToTwoDecimal(row.stock_quantity),
    },
    {
      name: "Quantity to Transfer",
      selector: (row) => (
        <input
          type="text"
          required
          style={{ width: "120px" }}
          className="form-control"
          value={formatToTwoDecimal(row.quantity_to_transfer || "")}
          readOnly={!isEdited}
          onChange={(e) => {
            handleQuantityToTransfer(e.target.value, row);
          }}
          // Prevent deletion if the default value "0"
          onKeyDown={(e) => {
            if (e.key === "Backspace" && e.target.value === "0")
              e.preventDefault();
          }}
          min={0}
          max={row.available}
        />
      ),
    },
    {
      name: !isEdited ? "" : "Action",
      cell: (row) => (
        <button
          className={`btn btn-danger btn-sm ${!isEdited ? "d-none" : ""}`}
          type="button"
          onClick={() => handleRemoveItem(row.product_id)}
          disabled={!isEdited}
        >
          Remove
        </button>
      ),
    },
  ];

  // Product list columns (Inside modal)
  const productColumns = [
    {
      name: (
        <div className="custom-checkbox">
          <input
            type="checkbox"
            className="form-check-input"
            checked={productListModalPagination.data.every((item) =>
              draftedRows.includes(item.product_id)
            )}
            onChange={(e) => handleSelectAllRows(e.target.checked)}
          />
        </div>
      ),
      cell: (row) => (
        <div className="custom-checkbox">
          <input
            type="checkbox"
            className="form-check-input border-1 border-dark"
            checked={draftedRows.includes(row.product_id)}
            onChange={() => handleSelectRow(row.product_id)}
          />
        </div>
      ),
      ignoreRowClick: true,
      allowoverflow: true,
      button: true,
    },
    { name: "Product Code", selector: (row) => row.product_code },
    { name: "Product Name", selector: (row) => row.product_name },
    { name: "Product Category", selector: (row) => row.product_category },
    {
      name: "Average Price",
      selector: (row) => formatToTwoDecimal(row.average_price),
    },
    {
      name: "Quantity",
      selector: (row) => formatToTwoDecimal(row.stock_quantity),
    },
  ];

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, generateYears }, ref) => (
      <input
        type="text"
        className="form-control p-3 w-100"
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
        disabled={!isEdited}
        required
      />
    )
  );

  // Fetch warehouse info
  useEffect(() => {
    if (!isFetchedRef.current) {
      fetchWarehouseList_FROM();
      fetchTransactionData();
      isFetchedRef.current = true;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  useEffect(() => {
    // Provide default value of "0" to all rows of productsToTransfer for the current page
    if (productListPagination?.data) {
      const provideDefault = productListPagination.data.filter((i) => {
        const product = productsToTransfer.current.get(i.product_id);
        const quantityToTransfer = product?.quantity_to_transfer;
        return quantityToTransfer == 0 || !quantityToTransfer;
      });

      for (const item of provideDefault) {
        productsToTransfer.current.set(item.product_id, {
          available: item.stock_quantity,
          average_price: item.average_price,
          productId: item.product_id,
          quantity_to_transfer: "0",
        });
      }
    }

    // Restore quantity_to_transfer from productsToTransfer Map
    // so that user-entered values persist when productListPagination.data changes
    if (productsToTransfer.current.size > 0) {
      productListPagination.setData((prev) => {
        let changed = false;

        const next = prev.map((item) => {
          const product = productsToTransfer.current.get(item.product_id);
          if (
            !product ||
            item.quantity_to_transfer === product.quantity_to_transfer
          ) {
            return item;
          }

          changed = true;

          return {
            ...item,
            quantity_to_transfer: product.quantity_to_transfer,
            ...(product.from_stock_transfer && {
              stock_quantity: product.available,
            }),
          };
        });

        return changed ? next : prev; // only update if something actually changed
      });
    }
  }, [productListPagination.data]);

  return (
    <div className="h-100 w-100 bg-white">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/inventory/stock-transfer" className="text-dark me-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            STOCK TRANSFER | APPROVAL
          </span>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={updateStockTransfer}>
        <div className="container mt-3">
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Stock Transfer ID</span>
              <input
                type="text"
                className="form-control border-0 custom-input-form-readOnly p-3"
                value={transactionId}
                readOnly
              />
            </div>
            <div className="col-sm mb-3">
              <span>
                Transfer Date <span className="text-danger">*</span>
              </span>
              <CustomDatePicker
                label={"Transfer Date"}
                selected={countingDate ? new Date(countingDate) : ""}
                handleDateChange={(date) => {
                  setCountingDate(date);
                  dateValidation(date, setCountingDate, "Transfer Date");
                }}
                setter={setCountingDate}
                CustomInput={CustomInput}
                isRequired={true}
                validated={validated}
                dateValidation={dateValidation}
                iconTopOffset={"1.3rem"}
              />
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>
                Warehouse | Location From <span className="text-danger">*</span>
              </span>
              <select
                name=""
                id=""
                className="form-select p-3"
                value={warehouseFrom_id}
                required
                disabled={!isEdited}
                onChange={(e) => {
                  setWarehouseFrom_id(e.target.value);
                  fetchWarehouseList_TO(e.target.value);
                  setSelectedRows([]);
                  getProductList([], warehouseFrom_id);
                }}
              >
                <option value="" disabled>
                  Select Warehouse | Location
                </option>
                {warehouseList.map((warehouse, i) => (
                  <option key={i} value={warehouse.warehouse_id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-sm mb-3">
              <span>
                Warehouse | Location To <span className="text-danger">*</span>
              </span>
              <select
                name=""
                id=""
                className="form-select p-3"
                value={warehouseTo_id}
                required
                disabled={warehouseFrom_id === "" || !isEdited}
                onChange={(e) => setWarehouseTo_id(e.target.value)}
              >
                <option value="" disabled>
                  Select Warehouse | Location
                </option>
                {warehouseList_TO.map((warehouse, i) => (
                  <option key={i} value={warehouse.warehouse_id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Remarks</span>
              <textarea
                rows="5"
                className="form-control"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                readOnly={!isEdited}
              ></textarea>
            </div>
            <div className="col-sm"></div>
          </div>
        </div>
        <div className="container">
          <div className="w-100 d-flex align-items-center mt-3 p-2">
            <h5>Item List</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              data={productListPagination.data}
              customStyles={customStyles}
              className="dataTable"
            />
            <PaginationControls {...productListPagination} />
          </div>
          <div className="w-100 d-flex justify-content-end mt-5">
            <button
              type="button"
              className={`btn btn-primary btn-sm ${!isEdited ? "d-none" : ""}`}
              onClick={() => {
                getProductListModal();
                handleShow();
              }}
            >
              New Item
            </button>
          </div>
        </div>
        {status === "Pending" && (
          <div className="container mt-5">
            <div className="row">
              <div className="col-sm mb-2"></div>
              <div className="col-sm"></div>
              <div className="col-sm"></div>
              <div className="col-sm">
                {isEdited ? (
                  <div className="row">
                    <div className="col-sm mb-2">
                      <button
                        type="button"
                        variant="outline-secondary"
                        onClick={() => {
                          swal({
                            icon: "warning",
                            title: "Are you sure?",
                            text: "Your changes will not be saved",
                            dangerMode: true,
                            buttons: ["Cancel", "OK"],
                          }).then((confirmed) => {
                            if (confirmed) {
                              fetchTransactionData();
                              setIsEdited(false);
                              return;
                            }
                          });
                        }}
                        className="btn btn-outline-secondary w-100"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="col-sm">
                      <button type="submit" className="btn btn-primary w-100">
                        Update
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-sm mb-2">
                      <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={(e) => setIsEdited(true)}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="col-sm mb-2">
                      <button
                        type="button"
                        className="btn btn-danger w-100"
                        onClick={handleReject}
                        disabled={isCutoffPosted}
                      >
                        Reject
                      </button>
                    </div>
                    <div className="col-sm mb-2">
                      <button
                        type="button"
                        className="btn btn-success w-100"
                        onClick={handleApprove}
                        disabled={isCutoffPosted}
                      >
                        Approve
                      </button>
                    </div>
                    {isCutoffPosted && (
                      <div>
                        <p className="text-danger">
                          Approval and rejection actions are prohibited since
                          the Transfer date has already been posted.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Form>

      {/* Add Modal */}
      <Modal
        show={showModal}
        onHide={handleClose}
        size="xl"
        backdrop="static"
        className="custom-modal-width"
      >
        <Modal.Header className="border-0">
          <Modal.Title>INVENTORY | PRODUCT STOCK</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container-fluid">
            <div className="w-100 mt-4 mb-2">
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
                        filterColumn === "product_code" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("product_code")}
                    >
                      Product Code
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "product_name" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("product_name")}
                    >
                      Product Name
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "product_category" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("product_category")}
                    >
                      Product Category
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="w-100 mt-4 container-fluid">
            <DataTable
              columns={productColumns}
              data={productListModalPagination.data}
              customStyles={customStyles}
              className="dataTable"
            />
            <PaginationControls {...productListModalPagination} />
          </div>
          <Modal.Footer className="border-0 p-0 mt-5">
            <Button
              variant="outline-secondary"
              type="button"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button variant="primary" type="button" onClick={handleSubmitModal}>
              Submit
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default NewApprovalStockTransfer;
