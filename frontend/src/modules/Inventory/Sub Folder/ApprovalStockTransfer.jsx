import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate, useParams } from "react-router-dom";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import {
  PaginationControls,
  usePagination,
} from "../../../hooks/customHook/paginationHook/usePagination";

const CreateStockTransfer = () => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const { id } = useParams();
  const isFetchedRef = useRef(false);

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
  const [status, setStatus] = useState("");

  const [validated, setValidated] = useState(true);
  const [isEdited, setIsEdited] = useState(false);
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [filterColumn, setFilterColumn] = useState("all");

  const handleShow = () => {
    setShowModal(true);

    fetchInventoryList(itemList);
  };
  const handleClose = () => {
    setShowModal(false);
    setFilterColumn("all");
    setSearchText("");
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
          value={
            row.quantity_to_transfer.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) || ""
          }
          readOnly={!isEdited}
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
      name: !isEdited ? "" : "Action",
      cell: (row) => (
        <button
          className={`btn btn-danger btn-sm ${!isEdited ? "d-none" : ""}`}
          type="button"
          onClick={() => handleRemoveItem(row.productId)}
          disabled={!isEdited}
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

  // console.log(itemList);
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

  // const fetchTransactionId = () => {
  //   axios
  //     .get(BASE_URL + "/stock_transfer/getCodeStockTransfer")
  //     .then((res) => {
  //       setTransactionId(res.data);
  //     })
  //     .catch((err) => console.log(err));
  // };

  const fetchTransactionData = async () => {
    axios
      .get(BASE_URL + "/stock_transfer/getDataCreated", {
        params: {
          stock_transfer_id: id,
        },
      })
      .then((res) => {
        // console.log("res.data", res.data);
        setTransactionId(res.data.transaction_id);
        setCountingDate(res.data.date_transfer);
        setWarehouseFrom_id(res.data.warehouse_from_id);
        setWarehouseTo_id(res.data.warehouse_to_id);
        setRemarks(res.data.description);
        setStatus(res.data.status);
        setIsCutoffPosted(res.data.isPosted);

        fetchWarehouseList_TO(res.data.warehouse_from_id);

        // Create an array of items to update the state in one go
        const newItemList = res.data.stock_transfer_products.map((item) => ({
          stock_transfer_product_id: item.id,
          productId: item.product_id,
          productCode: item.product_list.product_code,
          productName: item.product_list.product_name,
          available: item.available_quantity,
          quantity_to_transfer: item.quantity_to_transfer,
        }));

        // Update itemList state once
        setItemList(newItemList);
        // setItemList((prevList) => [...prevList, ...newItemList]);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    // console.log("---");
    if (!isFetchedRef.current) {
      fetchWarehouseList_FROM();
      fetchTransactionData();
      isFetchedRef.current = true;
    }
    // fetchTransactionId();

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
    ?.filter(
      (item) =>
        // Only show products that match the category AND are not already in itemList

        !itemList.some((listItem) => listItem.productId === item.product_id)
    )
    ?.map((data, i) => {
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
      quantity_to_transfer: 0,
    }));

    setItemList([...itemList, ...newItems]);
    handleClose();
  };

  const updateStockTransfer = async (e) => {
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

      if (itemList.length === 0) {
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

  const handleCancel = () => {
    navigate("/inventory/stock-transfer");
  };

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
                itemProductToTransfer: itemList,
                warehouse_from_id: warehouseFrom_id,
                warehouse_to_id: warehouseTo_id,
                userLoggedID,
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
                itemProductToTransfer: itemList,
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
      readOnly={!isEdited}
      required
    />
  ));

  useEffect(() => {
    setInventoryList(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    fetchInventoryList(itemList);
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">STOCK TRANSFER | APPROVAL</span>
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
              {/* <input
                type="date"
                value={countingDate}
                onChange={(e) => setCountingDate(e.target.value)}
                readOnly={!isEdited}
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
                disabled={!isEdited}
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
              data={itemList}
              customStyles={customStyles}
              className="dataTable"
            />
            <PaginationControls {...paginationHook} />
          </div>
          <div className="w-100 d-flex justify-content-end mt-5">
            <button
              type="button"
              className={`btn btn-primary btn-sm ${!isEdited ? "d-none" : ""}`}
              onClick={handleShow}
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
                          }).then(() => {
                            fetchTransactionData();
                            setIsEdited(false);
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
                        className="btn btn-warning w-100"
                        onClick={(e) => setIsEdited(true)}
                      >
                        Edit
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
