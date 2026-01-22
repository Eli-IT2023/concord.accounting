import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../../../assets/global/url";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../../assets/table-style";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";
import useDecodeToken from "../../../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import {
  PaginationControls,
  usePagination,
} from "../../../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../../../hooks/customHook/paginationHook/useServerPagination";
import { useDateValidation } from "../../../../../hooks/customHook/useDateValidation";
import CustomDatePicker from "../../../../../components/CustomDatePicker";

const NewCreateStockTransfer = () => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const [countingDate, setCountingDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Validations
  const { dateValidation } = useDateValidation();
  const [validated, setValidated] = useState(false);

  const [showModal, setShowModal] = useState(false); // For modal

  // For warehouse states
  const warehouseRef = useRef([]);
  const [warehouseList, setWarehouseList] = useState([]);
  const [warehouseList_TO, setWarehouseList_TO] = useState([]);
  const [warehouseFrom_id, setWarehouseFrom_id] = useState("");
  const [warehouseTo_id, setWarehouseTo_id] = useState("");

  const [selectedRows, setSelectedRows] = useState([]); // Already selected and submitted rows
  const [draftedRows, setDraftedRows] = useState([]); // Unconfirmed state, or temporary rows
  const [allItems, setAllItems] = useState({}); // Used for validation on invalid quantity for quantity to transfer
  const productsToTransfer = useRef(new Map()); // Stores products to transfer, send in backend

  // Other input field states
  const [transactionId, setTransactionId] = useState("");
  const [remarks, setRemarks] = useState("");

  // For search filter
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const debounceTimer = useRef(null);

  // For table fetchings
  const productListPagination = useServerPagination("about:blank", 10);
  const productListModalPagination = useServerPagination("about:blank", 10);
  const stockTransferEndpoint = `${BASE_URL}/stock_transfer`;

  // Helper: format number to 2 decimal places
  const formatToTwoDecimal = (num) => {
    const value = num || 0;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get the item list table
  const getProductList = (productIdList) => {
    productListPagination.updateHttpMethod("POST");
    productListPagination.updateApiUrl(
      `${stockTransferEndpoint}/products/summary`
    );
    productListPagination.updateParams({
      warehouseId: warehouseFrom_id,
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

  // Generate stock transfer transaction id
  const fetchTransactionId = () => {
    axios
      .get(BASE_URL + "/stock_transfer/getCodeStockTransfer")
      .then((res) => {
        setTransactionId(res.data);
      })
      .catch((err) => console.log(err));
  };

  // Handle show modal
  const handleShow = () => {
    setShowModal(true);
  };

  // Handle close modal
  const handleClose = () => {
    setShowModal(false);
    setSearchText("");
    setFilterColumn("all");
    setDraftedRows([]);
  };

  // prettier-ignore
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

  // Handle quantity to transfer change
  const handleQuantityToTransfer = (eValue, row) => {
    const value = eValue;
    const formattedAmount = parseFloat(String(eValue).replace(/,/g, ""));

    // Validation for stock exceeding quantity
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

  // Handle modal submission
  const handleSubmitModal = () => {
    const initializeItems = [...selectedRows, ...draftedRows].reduce(
      (acc, id) => ({ ...acc, [id]: "0" }),
      {}
    );

    setShowModal(false);
    getProductList([...new Set([...selectedRows, ...draftedRows])]); // Update Item List table fetching
    setSelectedRows((prev) => [...prev, ...draftedRows]);
    setAllItems((prev) => ({
      ...prev,
      ...initializeItems,
    }));
    setSearchText("");
    setDraftedRows([]); // Clear drafted rows
  };

  // Handle back
  const handleCancel = () => {
    navigate("/inventory/stock-transfer");
  };

  // Handle creation of new stock transfer
  const addStockTransfer = async (e) => {
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
      dateValidation(countingDate, setCountingDate, "Transfer Date");

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

      if (productListPagination.data.length == 0) {
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
          text: "Are you sure you want to create this stock transfer?",
          buttons: ["Cancel", "Confirm"],
        }).then((yes) => {
          if (yes) {
            axios
              .post(BASE_URL + "/stock_transfer/createStockTransfer", {
                countingDate: countingDate,
                remarks: remarks,
                warehouseFrom_id: warehouseFrom_id,
                warehouseTo_id: warehouseTo_id,
                transactionId: transactionId,
                itemProductToTransfer: formattedItemList,
                userLoggedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    title: "Success",
                    text: "Stock Transfer saved successfully!",
                    icon: "success",
                    button: "OK",
                  }).then(() => {
                    navigate("/inventory/stock-transfer");
                  });
                } else {
                  ErrorInserted();
                }
              })
              .catch((error) => {
                if (error.response && error.response.status == 409) {
                  swal({
                    title: "Oopps!",
                    text: "Action is prohibited because the date provided for the Transfer date has already passed the posted cutoff.",
                    icon: "error",
                    button: true,
                  });
                }
              });
          }
        });
      }
    }
  };

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
          value={row.quantity_to_transfer || ""}
          onChange={(e) => handleQuantityToTransfer(e.target.value, row)}
          onKeyDown={(e) =>
            e.key === "Backspace" && e.target.value == 0 && e.preventDefault()
          }
          min="0"
          max={row.stock_quantity}
        />
      ),
    },
    {
      name: "Action",
      cell: (row) => (
        <button
          className="btn btn-danger btn-sm"
          type="button"
          onClick={() => handleRemoveItem(row.product_id)}
        >
          Remove
        </button>
      ),
    },
  ];

  const ErrorInserted = () => {
    swal({
      title: "Something went wrong",
      text: "Please Contact your support immediately",
      icon: "error",
      button: "OK",
      dangerMode: true,
    });
  };

  useEffect(() => {
    fetchWarehouseList_FROM();
    fetchTransactionId();

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
    if (productsToTransfer.current.size) {
      productListPagination.setData((prev) => {
        let changed = false;

        const next = prev.map((item) => {
          const product = productsToTransfer.current.get(item.product_id);
          if (
            product &&
            item.quantity_to_transfer !== product.quantity_to_transfer
          ) {
            changed = true;
            return {
              ...item,
              quantity_to_transfer: product.quantity_to_transfer,
            };
          }
          return item;
        });

        return changed ? next : prev; // only update if something actually changed
      });
    }
  }, [productListPagination.data]);

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
        required
      />
    )
  );

  return (
    <div className="h-100 w-100 bg-white">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">NEW STOCK TRANSFER</span>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={addStockTransfer}>
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
                onChange={(e) => {
                  setWarehouseFrom_id(e.target.value);
                  fetchWarehouseList_TO(e.target.value);
                  setSelectedRows([]);
                  getProductList([]);
                }}
                ref={(el) => (warehouseRef.current[0] = el)}
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
                disabled={warehouseFrom_id === ""}
                onChange={(e) => {
                  setWarehouseTo_id(e.target.value);
                }}
                onMouseDown={(e) => {
                  if (warehouseList_TO.length === 0) {
                    e.preventDefault();
                    swal({
                      icon: "warning",
                      title: "Warning",
                      text: "At least two warehouses are required to perform a stock transfer. Please create another warehouse first.",
                    });
                    return;
                  }
                }}
                ref={(el) => (warehouseRef.current[1] = el)}
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
                onChange={(e) => setRemarks(e.target.value)}
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
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (!warehouseFrom_id || !warehouseTo_id) {
                  swal({
                    icon: "warning",
                    title: "Warning",
                    text: "Please fill the warehouse field first.",
                  }).then(() => {
                    warehouseRef.current[!warehouseFrom_id ? 0 : 1].focus();
                    warehouseRef.current[
                      !warehouseFrom_id ? 0 : 1
                    ].showPicker();
                  });
                  return;
                }
                getProductListModal();
                handleShow();
              }}
            >
              New Item
            </button>
          </div>
        </div>

        <div className="container mt-5">
          <div className="row">
            <div className="col-sm mb-2"></div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm">
              <div className="row">
                <div className="col-sm mb-2">
                  <button
                    variant="outline-secondary"
                    onClick={handleCancel}
                    className="btn btn-outline-secondary w-100"
                  >
                    Cancel
                  </button>
                </div>
                <div className="col-sm">
                  <button type="submit" className="btn btn-primary w-100">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default NewCreateStockTransfer;
