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

const OldCountingCreate = () => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const { dateValidation } = useDateValidation();

  // const [product, setProduct] = useState([]);
  const [stockManagement, setStockManagement] = useState([]);
  const [itemList, setItemList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [warehouse, setWarehouse] = useState("");
  const [warehouseList, setWarehouseList] = useState([]);
  const [category, setCategory] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [firstRender, setFirstRender] = useState(true);

  const [transactionId, setTransactionId] = useState("");
  const [countingDate, setCountingDate] = useState();
  const [remarks, setRemarks] = useState("");
  const [user, setUser] = useState("Admin");

  const [searchTerm, setSearchTerm] = useState("");

  const [validated, setValidated] = useState(false);
  const itemListPagination = usePagination(itemList, 10);

  const warehouseRef = useRef(null);

  const handleShow = () => setShowModal(true);
  const resetModalState = () => {
    // setWarehouse("");
    setCategory("");
    setSearchText("");
    setSelectedRows([]);
  };

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

    // if (lastTransaction) {
    //   const lastNumber = parseInt(lastTransaction.slice(-4));
    //   const incrementedNumber = String(lastNumber + 1).padStart(4, "0");
    //   newTransactionNumber = `${dateToday}${incrementedNumber}`;
    // } else {
    //   newTransactionNumber = `${dateToday}0001`;
    // }

    setTransactionId("COUNT-" + newTransactionNumber);
  };
  useEffect(() => {
    generateTransactionNumber();
  }, []);

  const handleClose = () => {
    setShowModal(false);
    // setWarehouse("");
    setCategory("");
    setSearchText("");
    resetModalState();
    setSelectedRows([]);
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const handleActualAmountChange = (
    productId,
    newValue,
    warehouseName,
    actualAmount
  ) => {
    if (newValue == ".") {
      setItemList((prevData) =>
        prevData.map((row) =>
          row.productId === productId && row.warehouseName === warehouseName
            ? { ...row, [actualAmount]: prevData + "." } // Update actual count
            : row
        )
      );
    }

    let inputValue = newValue.replace(/[^0-9.]/g, "");
    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    let formatAmount = inputValue.replace(/,/g, "");

    setItemList((prevData) =>
      prevData.map((row) =>
        row.productId === productId && row.warehouseName === warehouseName
          ? { ...row, [actualAmount]: formattedValue } // Update actual count
          : row
      )
    );

    setFirstRender(false);
  };

  const columns = [
    // {
    //   name: "Product ID",
    //   selector: (row) => row.productId,
    // },
    {
      name: "Warehouse",
      selector: (row) => row.warehouseName,
    },
    {
      name: "Product Name",
      selector: (row) => row.productName,
    },
    {
      name: "System Quantity",
      selector: (row) =>
        row.systemQuality.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Actual Count",
      cell: (row) => (
        <input
          type="text"
          name="actual_count"
          // step="0.01"
          onInput={onInputFloat}
          className="form-control"
          value={row.actualCount} // Default to 0 if no value
          onChange={(e) => {
            let rawValue = e.target.value;

            if (/^0[0-9]+/.test(rawValue)) {
              rawValue = rawValue.replace(/^0+/, "");
            }

            if (rawValue === "") rawValue = "0";

            handleActualAmountChange(
              row.productId,
              rawValue,
              row.warehouseName,
              "actualCount"
            );
          }}
          min={0}
          required
        />
      ),
    },
    {
      name: "Average Price",
      selector: (row) =>
        row.averagePrice?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Actual Price",
      selector: (row) => (
        <input
          type="text"
          name="actual_price"
          // step="0.01"
          onInput={onInputFloat}
          className="form-control"
          value={row.actualPrice} // Default to 0 if no value
          onChange={(e) => {
            let rawValue = e.target.value;

            if (/^0[0-9]+/.test(rawValue)) {
              rawValue = rawValue.replace(/^0+/, "");
            }

            if (rawValue === "") rawValue = "0";

            handleActualAmountChange(
              row.productId,
              rawValue,
              row.warehouseName,
              "actualPrice"
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
        const systemQuantity = row.systemQuality;
        const actualCount =
          parseFloat(String(row.actualCount).replace(/,/g, "")) || 0;

        // if (firstRender || actualCount == "") {
        //   return "0.00";
        // }

        // Calculate adjustment and round to 2 decimals
        const adjustment =
          Math.round((actualCount - systemQuantity) * 100) / 100;

        // Return formatted adjustment
        // return adjustment > 0
        //   ? `+${adjustment.toFixed(2)}` // Add "+" for positive values and ensure 2 decimals
        //   : `${adjustment.toFixed(2)}`; // Ensure 2 decimals for negative or zero
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
          onClick={() => handleRemoveItem(row.productId, row.warehouseName)}
        >
          Remove
        </button>
      ),
    },
  ];

  const handleRemoveItem = (productId, warehouseName) => {
    setItemList(
      itemList.filter(
        (item) =>
          item.productId !== productId || item.warehouseName !== warehouseName
      )
    );
  };

  const handleSelectRow = (productId, warehouseName) => {
    const rowKey = `${productId}-${warehouseName}`;
    if (selectedRows.includes(rowKey)) {
      setSelectedRows(selectedRows.filter((key) => key !== rowKey));
    } else {
      setSelectedRows([...selectedRows, rowKey]);
    }
  };

  const handleSelectAll = () => {
    // Get all the products from productList that are not already in the itemList
    const selectableProducts = productList.filter(
      (item) =>
        !itemList.some(
          (existingItem) =>
            existingItem.productId === item.productId &&
            existingItem.warehouseName === item.warehouseName
        )
    );

    // Get the IDs of the products that can be selected
    const selectableProductIds = selectableProducts.map(
      (item) => `${item.productId}-${item.warehouseName}`
    );

    // If we want to select all products, we can add these to selectedRows
    setSelectedRows(selectableProductIds);
  };

  const fetchProductList = () => {
    axios
      .get(BASE_URL + "/inventoryCounting/getProductList")
      .then((res) => {
        console.log(res.data);
        setStockManagement(res.data);
      })
      .catch((err) => console.log(err));
  };

  const fetchWarehouseList = () => {
    axios
      .get(BASE_URL + "/inventoryCounting/getWarehouses")
      .then((res) => {
        setWarehouseList(res.data.map((item) => item.name));
      })
      .catch((error) => console.error(error));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setWarehouse("");
    setCategory("");
  };

  const filteredProductList = stockManagement.filter((data) => {
    const matchesSearch = data.product_list.product_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesWarehouse =
      warehouse === "" || data.warehouse.name === warehouse;
    const matchesCategory =
      category === "" || data.product_list.product_category === category;

    // Return true only if all conditions match
    return matchesSearch && matchesWarehouse && matchesCategory;
  });

  console.log(filteredProductList);

  // Pagination for inventory product list modal
  const productListPagination = usePagination(filteredProductList, 10);

  const paginationSliceStart =
    (productListPagination.currentPage - 1) *
    productListPagination.itemsPerPage;

  const paginationSliceEnd =
    productListPagination.currentPage * productListPagination.itemsPerPage;

  console.log(productListPagination, "pagination");

  const handleWarehouseChange = (e) => {
    setWarehouse(e.target.value);
    setSelectedRows([]);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSelectedRows([]);
  };

  useEffect(() => {
    fetchProductList();
    fetchWarehouseList();
  }, []);

  const productColumns = [
    {
      name: (
        <div className="custom-checkbox">
          <input
            type="checkbox"
            className="form-check-input"
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
        </div>
      ),
      cell: (row) => {
        const rowKey = `${row.productId}-${row.warehouseName}`;
        return (
          <div className="custom-checkbox">
            {itemList.some(
              (item) =>
                item.productId === row.productId &&
                item.warehouseName === row.warehouseName
            ) ? (
              <i class="fa-solid fa-check text-success"></i>
            ) : (
              <input
                type="checkbox"
                className="form-check-input border border-secondary"
                checked={selectedRows.includes(rowKey)}
                onChange={() =>
                  handleSelectRow(row.productId, row.warehouseName)
                }
                disabled={itemList.some(
                  (item) =>
                    item.productId === row.productId &&
                    item.warehouseName === row.warehouseName
                )}
              />
            )}
          </div>
        );
      },
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
    { name: "Warehouse", selector: (row) => row.warehouseName },
    // { name: "Product ID", selector: (row) => row.productId },
    { name: "Product Name", selector: (row) => row.productName },
    { name: "Product Category", selector: (row) => row.productCategory },
    // { name: "Product Cost", selector: (row) => row.cost },
    {
      name: "Average Price",
      selector: (row) =>
        row.avaragePrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Quantity",
      selector: (row) =>
        row.stock.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    // { name: "Total Value", selector: (row) => row.totalValue },
    // { name: "stockId", selector: (row) => row.stock_management_id },
  ];

  const productList = stockManagement.map((data, i) => {
    return {
      key: i,
      warehouseName: data.warehouse.name,
      productId: data.product_id,
      productName: data.product_list.product_name,
      productCategory: data.product_list.product_category,
      cost: data.price,
      avaragePrice: data.averagePrice,
      stock: data.totalStock,
      totalValue: "N/A",
      stock_management_id: data.stock_management_id,
    };
  });

  const handleSubmitModal = () => {
    const selectedProducts = productList.filter((item) =>
      selectedRows.includes(`${item.productId}-${item.warehouseName}`)
    );

    const newItems = selectedProducts
      .filter(
        (item) =>
          !itemList.some(
            (existingItem) =>
              existingItem.productId === item.productId &&
              existingItem.warehouseName === item.warehouseName
          )
      )
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        systemQuality: item.stock,
        actualCount: "",
        averagePrice: item.avaragePrice,
        actualPrice: item.avaragePrice,
        warehouseName: item.warehouseName,
        stock_management_id: item.stock_management_id,
      }));

    setItemList([...itemList, ...newItems]);
    handleClose();
  };

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const actualCount = e.target.elements.actual_count?.value;

    const formattedItemList = itemList.map((item) => ({
      ...item,
      actualCount: parseFloat(String(item.actualCount).replace(/,/g, "")),
      actualPrice: parseFloat(String(item.actualPrice).replace(/,/g, "")),
    }));

    // if (parseFloat(actualCount) == 0) {
    //   swal({
    //     icon: "error",
    //     title: "Input required",
    //     text: "Please enter a value greater than 0 for the Actual Count field",
    //   });
    //   return;
    // }

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
          itemList: formattedItemList,
          userLoggedID,
        })
        .then((res) => {
          if (res.status === 200) {
            setValidated(false);
            setItemList([]);
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

  const handleCancel = () => {
    navigate("/inventory/inventory-counting");
  };

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

          generateYears(date); // Reset/Initialize Year List based on selected date of birth
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required
      />
    )
  );

  return (
    <div className="h-100 w-100 border bg-white custom-container">
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
            {/* <div className="col-sm"></div> */}
            {/* <div className="col-sm"></div> */}

            <div className="col-sm">
              <span>Warehouse</span>
              <Form.Select
                id="warehouseFilter"
                className="form-control custom-form-height"
                value={warehouse}
                onChange={handleWarehouseChange}
                ref={warehouseRef}
              >
                <option value="" disabled>
                  All Warehouses
                </option>
                {
                  // [
                  //   ...new Set(
                  //     stockManagement.map((data) => data.warehouse.name)
                  //   ),
                  // ]
                  warehouseList.map((wh, index) => (
                    <option key={index} value={wh}>
                      {wh}
                    </option>
                  ))
                }
              </Form.Select>
            </div>
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Counting Date</span>
              {/* <input
                type="date"
                required
                className="form-control custom-form-height"
                onChange={(e) => setCountingDate(e.target.value)}
              /> */}
              {/* <div className="position-relative">
                <DatePicker
                  selected={countingDate}
                  onChange={(date) => {
                    setCountingDate(date);
                    dateValidation(date, setCountingDate, "Counting Date");
                  }}
                  dateFormat="MMM/dd/yyyy"
                  className="form-control p-2"
                  customInput={<CustomInput />}
                />
                <i
                  class="fa-solid fa-calendar-week calendar-position"
                  style={{
                    right: `${validated ? "2rem" : "1rem"}`,
                    top: "1.3rem",
                  }}
                ></i>
              </div> */}
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
            {/* <div className="col-sm"></div> */}
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
              data={itemList}
              customStyles={customStyles}
              className="dataTable"
            />
            <PaginationControls {...itemListPagination} />
          </div>
          <div className="w-100 d-flex justify-content-end pe-3 mt-5">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (warehouse === "") {
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
          <div className="container">
            <div className="row">
              {/* <div className="col-sm mb-2">
                <span>Warehouse</span>
                <select
                  id="warehouseFilter"
                  className="form-select"
                  value={warehouse}
                  onChange={handleWarehouseChange}
                >
                  <option value="">All Warehouses</option>
                  {[
                    ...new Set(
                      stockManagement.map((data) => data.warehouse.name)
                    ),
                  ].map((wh) => (
                    <option key={wh} value={wh}>
                      {wh}
                    </option>
                  ))}
                </select>
              </div> */}
              <div className="col-sm mb-2">
                <span>Product Category</span>
                <select
                  id="categoryFilter"
                  className="form-select"
                  value={category}
                  onChange={handleCategoryChange}
                >
                  <option value="">All Categories</option>
                  {/* {[
                    ...new Set(
                      stockManagement.map(
                        (data) => data.product_list.product_category
                      )
                    ),
                  ].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))} */}
                  {constant_productCategory.map((product, index) => (
                    <option key={index} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                {/* <button className="btn w-100">Apply Filter</button> */}
                <button
                  className="btn btn-secondary"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>
              <div className="col-sm"></div>
            </div>
            <div className="w-100 mt-4 mb-2">
              <div className="input-group">
                <input
                  id="searchBar"
                  type="text"
                  className="form-control"
                  placeholder="Search by Product Name"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {/* <button
                  type="button"
                  className="btn btn-outline-secondary dropdown-toggle-split"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-sliders"></i>
                </button> */}
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
              data={filteredProductList
                .slice(paginationSliceStart, paginationSliceEnd)
                .map((data, i) => ({
                  key: i,
                  warehouseName: data.warehouse.name,
                  productId: data.product_id,
                  productName: data.product_list.product_name,
                  productCategory: data.product_list.product_category,
                  cost: data.price,
                  avaragePrice: data.averagePrice,
                  stock: data.totalStock,
                  totalValue: "N/A",
                  stock_management_id: data.stock_management_id,
                }))}
              customStyles={customStyles}
            />
            <PaginationControls {...productListPagination} />
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

export default OldCountingCreate;
