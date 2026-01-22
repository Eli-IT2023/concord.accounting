import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";

const CountingCreate = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const { id } = useParams();
  const navigate = useNavigate();

  const [inventoryCounting, setInventoryCounting] = useState("");
  const [itemList, setItemList] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("");
  const [countingDate, setCountingDate] = useState("");
  const [isEditable, setIsEditable] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isCutoffPosted, setIsCutoffPosted] = useState(false);
  const [originalItemList, setOriginalItemList] = useState([]);

  const handleEdit = () => {
    setIsEditable((prev) => {
      return !prev;
    });
    setItemList(originalItemList);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const formattedItemList = itemList.map((item) => ({
      ...item,
      actual_count: parseFloat(String(item.actual_count).replace(/,/g, "")),
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
      swal({
        title: "Update this Inventory?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then(async (confirmed) => {
        if (confirmed) {
          try {
            const res = await axios.put(
              `${BASE_URL}/inventoryCounting/update/${id}`,
              {
                countingDate,
                remarks,
                itemList: formattedItemList,
                userLoggedID,
                countingId: inventoryCounting.inventory_counting_id,
              }
            );
            if (res.status === 200) {
              swal({
                title: "Success",
                text: res.data.message,
                icon: "success",
                button: "OK",
              }).then(() => {
                navigate("/inventory/inventory-counting");
              });
            }
          } catch (error) {
            if (error.response && error.response.status == 409) {
              swal({
                title: "Oopps!",
                text: "Action is prohibited because the date provided for the Counting Time has already passed the posted cutoff.",
                icon: "error",
                button: "OK",
              });
            }
          }
        }
      });
    }

    setValidated(true);
  };

  const fetchInventoryCounting = () => {
    axios
      .get(`${BASE_URL}/inventoryCounting/getInventoryCounting/${id}`)
      .then((res) => {
        setInventoryCounting(res.data);
        setRemarks(res.data.remarks);
        setCountingDate(res.data.counting_date.slice(0, 10));
        setIsCutoffPosted(res.data.isPosted);
        console.log(res.data);
        setStatus(res.data.status);
      })
      .catch((error) => {
        console.error("Error fetching inventory counting: ", error);
      });
  };

  const pagination = useServerPagination(
    `${BASE_URL}/inventoryCounting/getInventoryItemList/${id}`,
    10
  );

  const FetchItemList = () => {
    // axios
    //   .get(`${BASE_URL}/inventoryCounting/getInventoryItemList/${id}`)
    //   .then((res) => {
    //     setItemList(res.data);
    //     setOriginalItemList(res.data);
    //   });
  };

  useEffect(() => {
    setItemList(pagination.data);
    setOriginalItemList(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    fetchInventoryCounting();
    FetchItemList();
  }, [id]);

  const inventoryItemList = itemList.map((data, i) => ({
    key: i,
    productId: data.product_id || "N/A",
    productName: data.product_list?.product_name || "N/A",
    warehouseName: data.warehouse?.name || "N/A",
    quantity: data.system_quantity || 0,
    actualCount: data.actual_count || "",
  }));

  const handleActualCountChange = (productId, newCount) => {
    if (newCount == ".") {
      setItemList((prevData) =>
        prevData.map((row) =>
          row.productId === productId
            ? { ...row, actual_count: prevData + "." } // Update actual count
            : row
        )
      );
    }
    let inputValue = newCount.replace(/[^0-9.]/g, "");
    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    let formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setItemList((prevList) =>
      prevList.map((item) =>
        item.product_id == productId
          ? { ...item, actual_count: formattedValue }
          : item
      )
    );
  };
  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const columns = [
    // { name: "Product ID", selector: (row) => row.productId },
    { name: "Warehouse", selector: (row) => row.warehouseName },
    { name: "Product Name", selector: (row) => row.productName },
    {
      name: "System Quantity",
      selector: (row) =>
        row.quantity.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Actual Count",
      cell: (row) => (
        <input
          type="text"
          step="0.01"
          name="actual_count"
          className="form-control"
          onInput={onInputFloat}
          value={row.actualCount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          onKeyDown={(e) => {
            // Prevent '-' and 'e' from being typed
            if (["-", "e"].includes(e.key)) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            let rawValue = e.target.value;

            if (/^0[0-9]+/.test(rawValue)) {
              rawValue = rawValue.replace(/^0+/, "");
            }

            if (rawValue === "") rawValue = "0";
            handleActualCountChange(row.productId, rawValue);
          }}
          min={1}
          disabled={!authrztn.includes("InventoryCounting-Edit")}
          readOnly={!isEditable}
          required
        />
      ),
    },
    {
      name: "Adjustment",
      selector: (row) => {
        const systemQuantity = row.quantity || 0;
        const actualCount =
          parseFloat(String(row.actualCount).replace(/,/g, "")) || 0;

        const adjustment =
          Math.round((actualCount - systemQuantity) * 100) / 100;

        // return adjustment > 0
        //   ? `+${adjustment.toFixed(2)}`
        //   : adjustment.toFixed(2);
        return adjustment > 0
          ? `+${adjustment.toFixed(2)}`
          : adjustment.toFixed(2);
      },
    },
  ];

  const handleCancel = () => {
    navigate("/inventory/inventory-counting");
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    swal({
      title: "Approve this request?",
      text: "Are you sure you want to approve",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        const data = {
          countingDate,
          remarks,
          itemList: itemList.map((item) => ({
            productId: item.product_list.product_id,
            warehouseId: item.warehouse_id,
            quantity: item.system_quantity || 0,
            actualCount:
              parseFloat(String(item.actual_count).replace(/,/g, "")) || 0,
          })),
          inventoryCountingId: id,
          userLoggedID,
        };
        axios
          .post(`${BASE_URL}/inventoryCounting/approveInventoryCounting`, data)
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Request Approved Successfully",
                text: "The request has been successfully approved.",
                icon: "success",
              }).then(() => {
                navigate("/inventory/inventory-counting");
              });
            } else {
              swal({
                title: "Something Went Wrong",
                text: "Please contact your support immediately",
                icon: "error",
                dangerMode: true,
              });
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
            swal({
              title: "Something Went Wrong",
              text: "Please contact your support immediately",
              icon: "error",
              dangerMode: true,
            });
            console.error("Error approving request:", error);
          });
      }
    });
  };

  const handleReject = async (e) => {
    e.preventDefault();
    swal({
      title: "Reject this request?",
      text: "Are you sure you want to reject",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        axios
          .put(`${BASE_URL}/inventoryCounting/rejectInventoryCounting`, {
            id,
            userLoggedID,
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Request Rejected Successfully",
                text: "The request has been successfully rejected.",
                icon: "success",
                successMode: true,
              }).then(() => {
                navigate("/inventory/inventory-counting");
              });
            } else {
              swal({
                title: "Something Went Wrong",
                text: "Please contact your support immediately",
                icon: "error",
                dangerMode: true,
              });
            }
          });
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
      required
      disabled={!authrztn.includes("InventoryCounting-Edit")}
      readOnly={!isEditable}
    />
  ));

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/inventory/inventory-counting" className="text-dark me-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            INVENTORY COUNTING DETAILS
          </span>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={handleUpdate}>
        <div className="container-fluid mt-3">
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Counting ID</span>
              <input
                type="text"
                className="form-control custom-form-height border-0 custom-input-form-readOnly"
                readOnly
                value={inventoryCounting.inventory_counting_id || ""}
              />
            </div>
            <div className="col-sm"></div>
            {/* <div className="col-sm"></div> */}
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Counting Time</span>

              {/* <input
                type="date"
                className="form-control custom-form-height"
                value={countingDate || ""}
                onChange={(e) => setCountingDate(e.target.value)}
                disabled={!authrztn.includes("InventoryCounting-Edit")}
                readOnly={!isEditable}
                required
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
            <div className="col-sm"></div>
            {/* <div className="col-sm"></div> */}
          </div>
          <div className="row mx-auto">
            <div className="col-sm mb-3">
              <span>Remarks</span>
              <textarea
                rows="5"
                className="form-control"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={!authrztn.includes("InventoryCounting-Edit")}
                readOnly={!isEditable}
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
              data={inventoryItemList}
              customStyles={customStyles}
              className="dataTable"
            />
            <PaginationControls {...pagination} />
          </div>
        </div>

        <div className="container-fluid mt-5">
          <div className="row">
            <div className="col-sm ms-3">
              {authrztn.includes("InventoryCounting-Edit") &&
                status !== "Approved" &&
                status !== "Rejected" &&
                isEditable == false && (
                  <button
                    type="button"
                    variant="outline-secondary"
                    onClick={handleEdit}
                    className="btn btn-outline-secondary px-5"
                  >
                    Edit
                  </button>
                )}
            </div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm me-3">
              {authrztn.includes("InventoryCounting-Approve") &&
                status !== "Approved" &&
                status !== "Rejected" && (
                  <div className="row">
                    {isEditable === false && (
                      <>
                        <div className="col-sm mb-2">
                          <button
                            variant="outline-secondary"
                            onClick={handleReject}
                            disabled={isCutoffPosted}
                            className="btn btn-outline-danger w-100"
                          >
                            Reject
                          </button>
                        </div>
                        <div className="col-sm">
                          <button
                            type="button"
                            onClick={handleApprove}
                            className="btn btn-success w-100"
                            disabled={status === "Approved" || isCutoffPosted}
                          >
                            Approve
                          </button>
                        </div>
                        {isCutoffPosted && (
                          <div>
                            <p className="text-danger">
                              Approval and rejection actions are prohibited
                              since the Counting time has already been posted.
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {isEditable === true && (
                      <>
                        <div className="col-sm mb-2">
                          <button
                            type="button"
                            variant="outline-secondary"
                            onClick={handleEdit}
                            className="btn btn-outline-secondary w-100"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="col-sm">
                          <button
                            type="submit"
                            // onClick={handleApprove} // Uncomment if needed
                            className="btn btn-primary w-100"
                            // disabled={status === "Approved"} // Uncomment if needed
                          >
                            Update
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default CountingCreate;
