import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../../../assets/global/url";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../../assets/table-style";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Link, useNavigate } from "react-router-dom";
import useDecodeToken from "../../../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import {
  PaginationControls,
  usePagination,
} from "../../../../../hooks/customHook/paginationHook/usePagination";
import { useDateValidation } from "../../../../../hooks/customHook/useDateValidation";
import { truncateToTwoDecimals } from "../../../../../utils/numberFormatter";
import { constant_productCategory } from "../../../../../constants/productOptions";
import CustomDatePicker from "../../../../../components/CustomDatePicker";
import { useServerPagination } from "../../../../../hooks/customHook/paginationHook/useServerPagination";

const NewCountingCreate = () => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const [user, setUser] = useState("Admin");

  // Validations
  const { dateValidation } = useDateValidation();
  const [validated, setValidated] = useState(false);

  // For input fields
  const warehouseRef = useRef(null);
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouseList, setWarehouseList] = useState([]);
  const [transactionId, setTransactionId] = useState("");
  const [countingDate, setCountingDate] = useState();
  const [remarks, setRemarks] = useState("");

  const [selectedRows, setSelectedRows] = useState([]); // Already selected and submitted rows
  const [draftedRows, setDraftedRows] = useState([]); // Unconfirmed state, or temporary rows
  const countingProducts = useRef(new Map()); // Store products for counting, send in backend

  // For search filter
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const debounceTimer = useRef(null);

  // For fetchings
  const productListModalPagination = useServerPagination("about:blank", 10);
  const productListPagination = useServerPagination("about:blank", 10);
  const inventoryCountingEndpoint = `${BASE_URL}/inventoryCounting`;

  const [showModal, setShowModal] = useState(false); // For modal

  // Helper: parse a numeric value by removing commas and converting to number
  const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));

  // Helper: format a number to 2 decimal places
  const formatToTwoDecimal = (num) => {
    const value = num ?? 0;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get the item list table
  const getProductList = (productIdList) => {
    productListPagination.updateHttpMethod("POST");
    productListPagination.updateApiUrl(
      `${inventoryCountingEndpoint}/products/summary`
    );
    productListPagination.updateParams({
      warehouseId,
      productList: productIdList?.map((id) => `'${id}'`) || [],
    });
  };

  // Get the modal's table
  const getProductListModal = () => {
    productListModalPagination.updateHttpMethod("POST");
    productListModalPagination.updateApiUrl(
      `${inventoryCountingEndpoint}/products/summary/selectable`
    );
    productListModalPagination.updateParams({
      warehouseId,
      productList: selectedRows?.map((id) => `'${id}'`) || [],
    });
  };

  // Function to generate inventory counting's transaction number
  const generateTransactionNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const dateToday = `${year}${month}`;

    const generateTwoNum = Math.floor(10 + Math.random() * 90);
    const time = new Date()
      .toLocaleTimeString("en-GB", { hour12: false })
      .replace(/:/g, "");

    let newTransactionNumber = dateToday + time + generateTwoNum;

    setTransactionId("COUNT-" + newTransactionNumber);
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  // Handle actual count and actual price change
  const handleActualAmountChange = (productId, newValue, actualAmount, row) => {
    let inputValue = newValue.replace(/[^0-9.]/g, "");
    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    const cleanedValue = formattedValue.replace(/^0+,|^0+/, ""); // Remove leading zeros and comma

    // Update the edited value in the paginated product list
    productListPagination.setData((prevList) =>
      prevList.map((item) =>
        item.product_id === row.product_id
          ? { ...item, [actualAmount]: cleanedValue }
          : item
      )
    );

    // Update the countingProducts actual_count or actual_price
    countingProducts.current.set(row.product_id, {
      product_id: row.product_id,
      stock_management_id: null,
      [actualAmount]: cleanedValue,
      // Keep the amount of the other
      ...(actualAmount === "actual_count"
        ? { actual_price: row.actual_price }
        : { actual_count: row.actual_count }),
    });
  };

  // Helper: array filter by productId
  const removeId = (array, productId) => {
    return array.filter((id) => id !== productId);
  };

  // prettier-ignore
  // Handle table item removal
  const handleRemoveItem = (productId) => {
    countingProducts.current.delete(productId);

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

  // Get the list of warehouses
  const fetchWarehouseList = () => {
    axios
      .get(BASE_URL + "/inventoryCounting/getWarehouses")
      .then((res) => {
        setWarehouseList(
          res.data.map((item) => ({
            warehouse_id: item.warehouse_id,
            warehouse_name: item.name,
          }))
        );
      })
      .catch((error) => console.error(error));
  };

  // Handle search change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      productListModalPagination.updateHttpMethod("POST");
      productListModalPagination.updateApiUrl(
        `${inventoryCountingEndpoint}/products/summary/selectable/search`
      );
      productListModalPagination.updateParams({
        warehouseId,
        productList: selectedRows?.map((id) => `'${id}'`) || [],
        searchText: value,
        productCategory: category,
      });
    }, 500);
  };

  // Handle clear filter
  const handleClearFilters = () => {
    setSearchTerm("");
    setCategory("");
  };

  // Handle warehouse change
  const handleWarehouseChange = (e) => {
    setWarehouseId(e.target.value);
    setSelectedRows([]);
    getProductList([]);
  };

  // Handle change category
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSelectedRows([]);
  };

  // Handle show modal
  const handleShow = () => setShowModal(true);

  // Handle close modal
  const handleClose = () => {
    setShowModal(false);
    setCategory("");
    setSearchTerm("");
    setDraftedRows([]);
  };

  // Handle modal submission
  const handleSubmitModal = () => {
    getProductList([...new Set([...selectedRows, ...draftedRows])]); // Update Item List table fetching
    setSelectedRows((prev) => [...prev, ...draftedRows]);
    setShowModal(false);
    setSearchTerm("");
    setDraftedRows([]); // Clear drafted rows
  };

  // Handle add new inventory counting transaction
  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const countingItems = countingProducts.current;

    // Remove the comma and convert to number
    for (const [key, value] of countingItems.entries()) {
      const product = countingItems.get(key);
      countingItems.set(key, {
        ...product,
        actual_count: parseNumber(value.actual_count),
        actual_price: parseNumber(value.actual_price),
      });
    }

    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill the red text fields",
      });
    } else {
      axios
        .post(`${BASE_URL}/inventoryCounting/saveInventoryCounting`, {
          countingDate: countingDate,
          remarks: remarks,
          user: user,
          transactionId: transactionId,
          itemList: Object.fromEntries(countingItems), // Convert to object to pass in backend
          selectedRows, // List of product ids
          userLoggedID,
          warehouseId,
        })
        .then((res) => {
          if (res.status === 200) {
            setValidated(false);
            swal({
              title: "Success",
              text: "Inventory Counting saved successfully!",
              icon: "success",
              button: "OK",
            }).then(() => {
              navigate("/inventory/inventory-counting");
            });
          } else {
            ErrorInserted();
          }
        })
        .catch((error) => {
          if (error.response && error.response.status == 409) {
            swal({
              title: "Oopps!",
              text: "Action is prohibited because the date provided for the Counting Time has already passed the posted cutoff.",
              icon: "error",
              button: "OK",
            });
          }
        });
    }
    setValidated(true);
  };

  const ErrorInserted = () => {
    swal({
      title: "Something went wrong",
      text: "Please Contact our Support",
      icon: "error",
      button: "OK",
    });
  };

  // Handle go back
  const handleCancel = () => {
    navigate("/inventory/inventory-counting");
  };

  // Item list's column (Outside table)
  const columns = [
    {
      name: "Product Name",
      selector: (row) => row.product_name,
    },
    {
      name: "System Quantity",
      selector: (row) => formatToTwoDecimal(row.stock_quantity),
    },
    {
      name: "Actual Count",
      cell: (row) => (
        <input
          type="text"
          name="actual_count"
          className="form-control"
          value={row.actual_count || ""}
          onChange={(e) => {
            handleActualAmountChange(
              row.product_id,
              e.target.value,
              "actual_count",
              row
            );
          }}
          min={0}
          required
        />
      ),
    },
    {
      name: "Average Price",
      selector: (row) => formatToTwoDecimal(row.average_price),
    },
    {
      name: "Actual Price",
      selector: (row) => (
        <input
          type="text"
          name="actual_price"
          onInput={onInputFloat}
          className="form-control"
          value={row.actual_price}
          onChange={(e) => {
            let rawValue = e.target.value;

            if (/^0[0-9]+/.test(rawValue)) {
              rawValue = rawValue.replace(/^0+/, "");
            }

            if (rawValue === "") rawValue = "0";

            handleActualAmountChange(
              row.product_id,
              rawValue,
              "actual_price",
              row
            );
          }}
          min={0}
          required
        />
      ),
    },
    {
      name: "Adjustment",
      selector: (row) => {
        // Retrieve systemQuantity and actualCount
        const systemQuantity = row.stock_quantity;
        const actualCount = parseNumber(row.actual_count);

        // Calculate adjustment and round to 2 decimals
        const adjustment =
          Math.round((actualCount - systemQuantity) * 100) / 100;

        return adjustment > 0
          ? `+${truncateToTwoDecimals(adjustment)}`
          : truncateToTwoDecimals(adjustment);
      },
    },
    {
      name: "Action",
      cell: (row) => (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => handleRemoveItem(row.product_id)}
        >
          Remove
        </button>
      ),
    },
  ];

  // Product columns for modal's table
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
      cell: (row) => {
        const productId = row.product_id;
        return (
          <div className="custom-checkbox">
            <input
              type="checkbox"
              className="form-check-input border border-secondary"
              checked={draftedRows.includes(productId)}
              onChange={() => handleSelectRow(productId)}
            />
          </div>
        );
      },
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
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
        required
      />
    )
  );

  useEffect(() => {
    generateTransactionNumber();
    fetchWarehouseList();
  }, []);

  useEffect(() => {
    // Provide default value of "0" to all actual count of countingProducts for the current page
    if (productListPagination?.data) {
      const provideDefault = productListPagination.data.filter((i) => {
        const product = countingProducts.current.get(i.product_id);
        const actualCount = product?.actual_count;
        return !actualCount;
      });

      for (const item of provideDefault) {
        countingProducts.current.set(item.product_id, {
          product_id: item.product_id,
          stock_management_id: null,
          actual_price: item.actual_price,
          actual_count: "0", // Initialize as 0
        });
      }
    }

    // Restore actual count and actual price from countingProducts Map
    // so that user-entered values persist when productListPagination.data changes
    if (countingProducts.current.size > 0) {
      productListPagination.setData((prev) => {
        let changed = false;

        const next = prev.map((item) => {
          const product = countingProducts.current.get(item.product_id);

          if (
            product &&
            (item.actual_count !== product.actual_count ||
              item.actual_price !== product.actual_price)
          ) {
            changed = true;
            return {
              ...item,
              actual_count: product.actual_count || 0,
              actual_price: product.actual_price || 0,
            };
          }
          return item;
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
            <Link to="/inventory/inventory-counting" className="text-dark me-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            NEW INVENTORY COUNTING
          </span>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={add}>
        <div className="container-fluid mt-3">
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Counting ID</span>
              <input
                type="text"
                className="form-control custom-form-height border-0 custom-input-form-readOnly"
                value={transactionId}
                readOnly
              />
            </div>

            <div className="col-sm">
              <span>Warehouse</span>
              <Form.Select
                id="warehouseFilter"
                className="form-control custom-form-height"
                value={warehouseId}
                onChange={handleWarehouseChange}
                ref={warehouseRef}
              >
                <option value="" disabled>
                  All Warehouses
                </option>
                {warehouseList.map((wh, index) => (
                  <option key={index} value={wh.warehouse_id}>
                    {wh.warehouse_name}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Counting Date</span>
              <CustomDatePicker
                label={"Counting Date"}
                selected={countingDate ? new Date(countingDate) : ""}
                handleDateChange={(date) => {
                  setCountingDate(date);
                  dateValidation(date, setCountingDate, "Counting Date");
                }}
                setter={setCountingDate}
                CustomInput={CustomInput}
                isRequired={true}
                validated={validated}
                dateValidation={dateValidation}
                iconTopOffset={"1.3rem"}
              />
            </div>
            <div className="col-sm"></div>
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
        <div className="container-fluid">
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
          <div className="w-100 d-flex justify-content-end pe-3 mt-5">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (warehouseId === "") {
                  swal({
                    icon: "warning",
                    title: "Warning",
                    text: "Please fill the warehouse field first.",
                  }).then(() => {
                    warehouseRef.current.focus();
                    warehouseRef.current.showPicker();
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

        <div className="container-fluid mt-5">
          <div className="row">
            <div className="col-sm mb-2"></div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm pe-4">
              <div className="row">
                <div className="col-sm mb-2">
                  <button
                    variant="outline-secondary"
                    onClick={handleCancel}
                    className="btn btn-secondary w-100"
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
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>INVENTORY | PRODUCT LIST</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container-fluid">
            <div className="row">
              <div className="col-sm mb-2">
                <span>Product Category</span>
                <select
                  id="categoryFilter"
                  className="form-select"
                  value={category}
                  onChange={handleCategoryChange}
                >
                  <option value="">All Categories</option>
                  {constant_productCategory.map((product, index) => (
                    <option key={index} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                <button
                  className="btn btn-secondary"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>
              <div className="col-sm"></div>
            </div>
            <div className="w-100 mt-2 mb-2">
              <div>
                <input
                  id="searchBar"
                  type="text"
                  className="form-control"
                  placeholder="Search by Product Name"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button className="dropdown-item">Transaction No.</button>
                  </li>
                  <li>
                    <button className="dropdown-item">
                      Receiving Warehouse
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item">Date Created</button>
                  </li>
                  <li>
                    <button className="dropdown-item">Vendor</button>
                  </li>
                  <li>
                    <button className="dropdown-item">Due Date</button>
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
            />
            <PaginationControls {...productListModalPagination} />
          </div>
          <Modal.Footer className="border-0 p-0 mt-5">
            <Button variant="secondary" type="button" onClick={handleClose}>
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

export default NewCountingCreate;
