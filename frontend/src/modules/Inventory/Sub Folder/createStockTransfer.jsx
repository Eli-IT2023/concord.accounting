import React, { useState, useEffect } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import {
  PaginationControls,
  usePagination,
} from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";

const CreateStockTransfer = () => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();

  const [inventoryList, setInventoryList] = useState([]);
  const [itemList, setItemList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [warehouseList, setWarehouseList] = useState([]);
  const [warehouseList_TO, setWarehouseList_TO] = useState([]);
  const [warehouseFrom_id, setWarehouseFrom_id] = useState("");
  const [warehouseTo_id, setWarehouseTo_id] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  const [transactionId, setTransactionId] = useState("");
  const [countingDate, setCountingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [validated, setValidated] = useState(true);

  const handleShow = () => {
    setShowModal(true);
    console.log(itemList);
    fetchInventoryList(itemList);
  };
  const handleClose = () => {
    setShowModal(false);
    setSearchText("");
    setFilterColumn("all");
    setSelectedRows([]);
  };

  const handleQuantityToTransfer = (eValue, row) => {
    const value = eValue;

    if (eValue && eValue > row.available) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("center-swal-text");
      wrapper.innerHTML = `The quantity you entered: <strong>${eValue}</strong>, exceeds the Available stock. Please reduce the amount and try again.`;
      swal({
        icon: "error",
        title: "Stock Limit Exceeded",
        content: wrapper,
      }).then(() => {
        setItemList((prevList) =>
          prevList.map((item) =>
            item.productId === row.productId
              ? { ...item, quantity_to_transfer: "" }
              : item
          )
        );

        return;
      });
    }

    if (value == ".") {
      setItemList((prevList) =>
        prevList.map((item) =>
          item.productId === row.productId
            ? { ...item, quantity_to_transfer: prevList + "." }
            : item
        )
      );
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

    setItemList((prevList) =>
      prevList.map((item) =>
        item.productId === row.productId
          ? { ...item, quantity_to_transfer: formattedValue }
          : item
      )
    );

    // if (/^\d*\.?\d*$/.test(value)) {
    //   // Prevent multiple decimal points
    //   if ((value.match(/\./g) || []).length <= 1) {
    //     // let newValue = value === "" ? "" : parseFloat(value);

    //     let inputValue = value.replace(/[^0-9.]/g, "");

    //     if (inputValue) {
    //       inputValue = inputValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    //     }

    //     let formatAmount = inputValue.replace(/,/g, "");
    //     let numericValue = parseFloat(formatAmount);

    //     // if (numericValue > row.available) {
    //     //   let stringRowAvailable = String(row.available).replace(
    //     //     /\B(?=(\d{3})+(?!\d))/g,
    //     //     ","
    //     //   );

    //     //   inputValue = stringRowAvailable;
    //     // }

    //     setItemList((prevList) =>
    //       prevList.map((item) =>
    //         item.productId === row.productId
    //           ? { ...item, quantity_to_transfer: inputValue }
    //           : item
    //       )
    //     );
    //   }
    // }
  };

  const columns = [
    { name: "Product Code", selector: (row) => row.productCode },
    { name: "Product Name", selector: (row) => row.productName },
    {
      name: "Available",
      selector: (row) =>
        row.available.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
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
          // onChange={(e) => {
          //   const value = e.target.value;

          //   // Allow only numbers and one decimal point
          //   if (/^\d*\.?\d*$/.test(value)) {
          //     // Prevent multiple decimal points
          //     if ((value.match(/\./g) || []).length <= 1) {
          //       let newValue = value === "" ? "" : parseFloat(value);

          //       // Check if the new value is greater than available
          //       if (newValue > row.available) {
          //         newValue = row.available; // Set to available if greater
          //       }

          //       // Update the itemList state by creating a new row object
          //       setItemList((prevList) =>
          //         prevList.map((item) =>
          //           item.productId === row.productId
          //             ? { ...item, quantity_to_transfer: newValue } // Create a new object
          //             : item
          //         )
          //       );
          //     }
          //   }
          // }}
          onChange={(e) => handleQuantityToTransfer(e.target.value, row)}
          min="0"
          max={row.available}
        />
      ),
    },
    {
      name: "Action",
      cell: (row) => (
        <button
          className="btn btn-danger btn-sm"
          type="button"
          onClick={() => handleRemoveItem(row.productId)}
        >
          Remove
        </button>
      ),
    },
  ];

  // const handleActualCountChange = (productId, value) => {
  //   setItemList(
  //     itemList.map((item) =>
  //       item.productId === productId
  //         ? { ...item, actualCount: parseFloat(value) }
  //         : item
  //     )
  //   );
  // };

  const handleRemoveItem = (productId) => {
    setItemList(itemList.filter((item) => item.productId !== productId));
  };

  const handleSelectRow = (productId) => {
    if (selectedRows.includes(productId)) {
      setSelectedRows(selectedRows.filter((id) => id !== productId));
    } else {
      setSelectedRows([...selectedRows, productId]);
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const allProductIds = inventoryList.map((item) => item.product_id);
      setSelectedRows(allProductIds);
    } else {
      setSelectedRows([]);
    }
  };

  const pagination = useServerPagination(
    BASE_URL + "/stock_transfer/getInventoryList",
    10
  );

  const paginationHook = usePagination(itemList, 10);

  const fetchInventoryList = (itemList) => {
    pagination.updateParams({
      warehouse_id: warehouseFrom_id,
      itemList,
      searchText,
      filterColumn,
    });
    // axios
    //   .get(BASE_URL + "/stock_transfer/getInventoryList", {
    //     params: {
    //       warehouse_id: warehouseFrom_id,
    //       itemList,
    //       searchText,
    //       filterColumn,
    //     },
    //   })
    //   .then((res) => {
    //     setInventoryList(res.data);
    //     console.log(res.data);
    //   })
    //   .catch((err) => console.log(err));
  };

  const fetchWarehouseList_FROM = () => {
    axios
      .get(BASE_URL + "/warehouse/getWarehouse")
      .then((res) => {
        setWarehouseList(res.data);
      })
      .catch((err) => console.log(err));
  };

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

  const fetchTransactionId = () => {
    axios
      .get(BASE_URL + "/stock_transfer/getCodeStockTransfer")
      .then((res) => {
        setTransactionId(res.data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchWarehouseList_FROM();
    fetchTransactionId();

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      cell: (row) => (
        <div className="custom-checkbox">
          <input
            type="checkbox"
            className="form-check-input border-1 border-dark"
            checked={selectedRows.includes(row.productId)}
            onChange={() => handleSelectRow(row.productId)}
            disabled={itemList.some((item) => item.productId === row.productId)}
          />
        </div>
      ),
      ignoreRowClick: true,
      allowoverflow: true,
      button: true,
    },
    { name: "Product Code", selector: (row) => row.productCode },
    { name: "Product Name", selector: (row) => row.productName },
    { name: "Product Category", selector: (row) => row.productCategory },
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
        row.quantity.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    // { name: "Total Value", selector: (row) => row.totalValue },
  ];

  const productList = inventoryList
    .filter(
      (item) =>
        // Only show products that match the category AND are not already in itemList

        !itemList.some((listItem) => listItem.productId === item.product_id)
    )
    .map((data, i) => {
      return {
        key: i,
        // warehouseName: data.warehouse.name,
        productId: data.product_id,
        productCode: data.product_list.product_code,
        productName: data.product_list.product_name,
        productCategory: data.product_list.product_category,
        cost: data.price,
        avaragePrice: data.average_price,
        quantity: data.total_stock,
        totalValue: data.total_price * data.total_stock,
      };
    });

  const handleSubmitModal = () => {
    const selectedProducts = productList.filter((item) =>
      selectedRows.includes(item.productId)
    );

    const newItems = selectedProducts.map((item) => ({
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      available: item.quantity,
      quantity_to_transfer: "0",
    }));

    setItemList([...itemList, ...newItems]);
    handleClose();
  };

  const addStockTransfer = async (e) => {
    e.preventDefault();
    setValidated(true);
    const form = e.currentTarget;

    const formattedItemList = itemList.map((item) => ({
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
      if (itemList.some((item) => item.quantity_to_transfer == 0)) {
        swal({
          icon: "error",
          title: "Invalid Quantity",
          text: "Quantity to transfer must be greater than zero",
          button: "OK",
        });
        return;
      }

      if (itemList.length == 0) {
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

  const ErrorInserted = () => {
    swal({
      title: "Something went wrong",
      text: "Please Contact your support immediately",
      icon: "error",
      button: "OK",
      dangerMode: true,
    });
  };

  const handleCancel = () => {
    navigate("/inventory/stock-transfer");
  };

  useEffect(() => {
    if (
      productList &&
      pagination.currentPage === 1 &&
      productList.length < 10
    ) {
      pagination.setTotalPages(
        Math.ceil(productList?.length / pagination.itemsPerPage)
      );
    }
  }, [productList]);

  useEffect(() => {
    setInventoryList(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    fetchInventoryList(itemList);
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      className="form-control p-3 w-100"
      style={{
        cursor: "pointer",
        caretColor: "transparent",
      }}
      onClick={onClick}
      value={value}
      ref={ref}
      placeholder="Select Date"
      required
    />
  ));

  return (
    <div className="h-100 w-100 border bg-white custom-container">
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
              {/* <input
                type="date"
                value={countingDate}
                onChange={(e) => setCountingDate(e.target.value)}
                required
                className="form-control py-3 ps-3"
                style={{ paddingRight: `${validated ? "2rem" : "1rem"}` }}
              /> */}
              <div>
                <DatePicker
                  selected={countingDate}
                  onChange={(date) => {
                    setCountingDate(date);
                  }}
                  dateFormat="MMM dd, yyyy"
                  className="form-control p-2"
                  customInput={<CustomInput />}
                />
              </div>
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
                  setItemList([]);
                  fetchWarehouseList_TO(e.target.value);
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
                disabled={warehouseFrom_id === ""}
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
              data={itemList}
              customStyles={customStyles}
              className="dataTable"
            />
            <PaginationControls {...paginationHook} />
          </div>
          <div className="w-100 d-flex justify-content-end mt-5">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleShow}
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
            {/* <div className="row">
              <div className="col-sm mb-2">
                <span>Warehouse</span>
                <select className="form-select p-2">
                  <option value="" disabled>
                    Select Warehouse
                  </option>
                </select>
              </div>
              <div className="col-sm mb-2">
                <span>Product Category</span>
                <select
                  className="form-select p-2"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" disabled>
                    Select Product Category
                  </option>
                </select>
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                <button className="btn w-100">Apply Filter</button>
                <button className="btn btn-secondary w-100">
                  Clear Filter
                </button>
              </div>
              <div className="col-sm"></div>
            </div> */}
            <div className="w-100 mt-4 mb-2">
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
              data={productList}
              customStyles={customStyles}
              className="dataTable"
            />
            <PaginationControls {...pagination} />
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

export default CreateStockTransfer;
