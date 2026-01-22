import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import { NumericFormat } from "react-number-format";
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

import "../../../assets/css/lionchem.css";

const Purchase_request_update = ({ authrztn }) => {
  const { id } = useParams();
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const [purchaseRequest, setPurchaseRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [approveRemarks, setApproveRemarks] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [rejectValidated, setRejectValidated] = useState(false);
  const [approveValidated, setApproveValidated] = useState(false);
  const [prProduct, setPrProduct] = useState([]);
  const [validated, setValidated] = useState(false);

  // Date state for DatePicker
  const [dateNeeded, setDateNeeded] = useState(null);

  useEffect(() => {
    fetchPurchaseRequest();
  }, [id]);

  const fetchPurchaseRequest = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/PurchaseRequest/getData/${id}`
      );
      if (response.data.success) {
        setPurchaseRequest(response.data.data);

        // Parse the date for DatePicker
        if (response.data.data.date_needed) {
          setDateNeeded(parseISO(response.data.data.date_needed));
        } else {
          setDateNeeded(null);
        }
      } else {
        swal(
          "Error",
          response.data.message || "Failed to fetch purchase request",
          "error"
        );
        navigate("/purchases/purchase-request");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch purchase request details", "error");
      navigate("/purchases/purchase-request");
    } finally {
      setLoading(false);
    }
  };

  // ##### table #####
  const [paginationUrl, setPaginationUrl] = useState(
    `${BASE_URL}/PurchaseRequest/getOrderListData/${id}`
  );
  const pagination = useServerPagination(paginationUrl, 10);
  // ##### table end #####

  // ### reject modal ###
  const showRejectModal = () => setShowModal(true);

  const handleClose = () => {
    setShowModal(false);
    setShowModal2(false);
    setRejectRemarks("");
    setApproveRemarks("");
  };

  const handleReject = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
      setRejectValidated(true);
      return;
    }

    try {
      const confirmed = await swal({
        title: "Decline this purchase request?",
        text: "This action cannot be undone",
        icon: "warning",
        buttons: ["Cancel", "Confirm"],
        dangerMode: true,
      });

      if (confirmed) {
        setShowModal(false);
        const response = await axios.put(
          `${BASE_URL}/PurchaseRequest/reject/${id}`,
          {
            rejectRemarks: rejectRemarks,
            rejectedBy: userLoggedID,
            userLoggedID: userLoggedID,
          }
        );

        if (response.data.success) {
          swal({
            title: "Declined!",
            text: "Purchase request has been Declined",
            icon: "success",
            buttons: false,
            timer: 2500,
          }).then(() => {
            navigate("/purchases/purchase-request");
          });
        } else {
          throw new Error(response.data.message || "Failed to reject");
        }
      }
    } catch (error) {
      console.error("Rejection error:", error);
      swal({
        title: "Error",
        text:
          error.response?.data?.message || "Failed to reject purchase request",
        icon: "error",
      });
    } finally {
      setApproveRemarks("");
      setRejectRemarks("");
    }
  };
  // ### reject modal end ###

  // ### update ###
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    request_name: "",
    date_needed: "",
    remarks: "",
    orderItems: [],
  });

  // FIXED: Calculate initial weight for display
  useEffect(() => {
    if (purchaseRequest && prProduct.length > 0) {
      setFormValues({
        request_name: purchaseRequest.request_name || "",
        date_needed: purchaseRequest.date_needed || "",
        remarks: purchaseRequest.remarks || "",
        orderItems: prProduct.map((item) => {
          const quantity = parseFloat(
            String(item.quantity || 0).replace(/,/g, "")
          );
          const unit_quantity = parseFloat(item.unit_quantity) || 1;
          const displayWeight = quantity * unit_quantity;

          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity, // Store original quantity
            displayWeight: displayWeight, // Store calculated weight for display
            unit_quantity: item.unit_quantity,
            remarks: item.remarks || "",
            isUpdate: item.isUpdate,
            isValidQuantity: true,
            uom: item.uom,
          };
        }),
      });
    }
  }, [purchaseRequest, prProduct]);

  // FIXED: Validate based on display weight
  const validateForm = () => {
    let isValid = true;

    const isRequestNameValid = formValues.request_name.trim() !== "";
    const isDateNeededValid = dateNeeded !== null;

    const updatedOrderItems = formValues.orderItems.map((item) => {
      // Use displayWeight for validation (this is what user sees and edits)
      let numericValue;

      if (item.rawWeight !== undefined && item.rawWeight !== null) {
        // Use the raw value from NumericFormat (already a clean number)
        numericValue = item.rawWeight;
      } else if (item.displayWeight) {
        // Remove commas and parse if we only have the formatted value
        numericValue = parseFloat(String(item.displayWeight).replace(/,/g, ""));
      } else {
        numericValue = 0;
      }

      const isQuantityValid = numericValue > 0 && numericValue >= 0.01;

      if (!isQuantityValid) {
        isValid = false;
      }

      return {
        ...item,
        isValidQuantity: isQuantityValid,
      };
    });

    if (!isRequestNameValid || !isDateNeededValid) {
      isValid = false;
    }

    setFormValues((prev) => ({
      ...prev,
      orderItems: updatedOrderItems,
    }));

    return {
      isValid,
      isRequestNameValid,
      isDateNeededValid,
    };
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    const validation = validateForm();

    if (!validation.isValid) {
      setValidated(true);
      let errorMessage = "Please fill all required fields";
      const errors = [];

      if (!validation.isRequestNameValid)
        errors.push("Request Title is required");
      if (!validation.isDateNeededValid) errors.push("Date Needed is required");

      const invalidQuantities = formValues.orderItems.filter(
        (item) => !item.isValidQuantity
      );
      if (invalidQuantities.length > 0) {
        errors.push("All weights must be greater than 0");
      }

      swal({
        icon: "error",
        title: "Validation Error",
        text: errorMessage,
      });
      return;
    }

    try {
      const confirmed = await swal({
        title: "Confirm changes?",
        text: "Do you want to save these updates?",
        icon: "warning",
        buttons: ["Cancel", "Save"],
        dangerMode: false,
      });

      if (confirmed) {
        // Format date for backend: yyyy-MM-dd
        const formattedDateNeeded = dateNeeded
          ? format(dateNeeded, "yyyy-MM-dd")
          : "";

        const updateData = {
          id: purchaseRequest.id,
          userLoggedID: userLoggedID,
          request_name: formValues.request_name,
          date_needed: formattedDateNeeded, // Use formatted date for backend
          remarks: formValues.remarks,
          updatedBy: userLoggedID,
          orderItems: formValues.orderItems.map((item) => {
            // Get the raw weight value (what user entered)
            const rawWeight =
              item.rawWeight ||
              parseFloat(String(item.displayWeight || 0).replace(/,/g, ""));
            const unit_quantity = parseFloat(item.unit_quantity) || 1;

            // Calculate the quantity for backend: quantity = weight / unit_quantity
            const calculatedQuantity = rawWeight / unit_quantity;

            console.log(
              `Item ${item.id}: Weight=${rawWeight}, Unit Quantity=${unit_quantity}, Calculated Quantity=${calculatedQuantity}`
            );

            return {
              id: item.id,
              product_id: item.product_id,
              quantity: calculatedQuantity, // Send quantity = weight / unit_quantity
              remarks: item.remarks,
              isUpdate: item.isUpdate,
            };
          }),
        };

        console.log("Sending update data:", updateData);

        const response = await axios.put(
          `${BASE_URL}/PurchaseRequest/update/${id}`,
          updateData
        );

        if (response.data.success) {
          swal({
            title: "Success!",
            text: "Changes saved successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
          }).then(() => {
            setIsEditing(false);
            setValidated(false);
            reloadTable();
          });
        } else {
          throw new Error(response.data.message || "Failed to save changes");
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
      swal({
        title: "Error",
        text: error.response?.data?.message || "Failed to save changes",
        icon: "error",
      });
    }
  };

  // ### update end

  // ### product list
  const handleProductList = async (e, id) => {
    e.preventDefault();

    const remainingItems = pagination.data.length;

    if (remainingItems <= 1) {
      swal(
        "Cannot Delete",
        "You must have at least one item in the list.",
        "warning"
      );
      return;
    }

    const confirmed = await swal({
      title: "Are you sure?",
      text: "Do you really want to delete this item?",
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });

    if (confirmed) {
      const updatedItems = prProduct.map((item) =>
        item.id === id ? { ...item, isUpdate: !item.isUpdate } : item
      );
      setPrProduct(updatedItems);
    }
  };

  const reloadTable = () => {
    setPaginationUrl(
      `${BASE_URL}/PurchaseRequest/getOrderListData/${id}?t=${Date.now()}`
    );
    pagination.refreshData();
    fetchPurchaseRequest();
  };

  // ### product list end

  // ### approve
  const [showModal2, setShowModal2] = useState(false);
  const showApproveModal = () => setShowModal2(true);

  const handleApprove = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    setShowModal2(false);
    if (!id) {
      swal("Error", "Missing purchase request ID. Cannot proceed.", "error");
      return;
    }

    if (form.checkValidity() === false) {
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
      setApproveValidated(true);
      return;
    }

    console.log("Approved request ID:", id);

    try {
      const response = await axios.put(
        `${BASE_URL}/PurchaseRequest/approve/${id}`,
        {
          approveRemarks: approveRemarks,
          approvedBy: userLoggedID,
          userLoggedID: userLoggedID,
        }
      );

      if (response.data.success) {
        swal({
          title: "Approved!",
          text: "Purchase Request has been approved successfully",
          icon: "success",
          buttons: false,
          timer: 2000,
        }).then(() => {
          navigate("/purchases/purchase-request");
        });
      } else {
        throw new Error(response.data.message || "Failed to save changes");
      }
    } catch (error) {
      console.error("Approval error:", error);
      swal(
        "Error",
        error.message || "Failed to approve Purchase Order",
        "error"
      );
    } finally {
      setApproveRemarks("");
      setRejectRemarks("");
    }
  };

  useEffect(() => {
    if (pagination.data) {
      const data = pagination.data.map((item) => ({
        id: item.id,
        product_code: item.product_code,
        product_name: item.product_name,
        category: item.category,
        unit_quantity: item.unit_quantity,
        uom: item.uom || "",
        product_id: item.product_id,
        quantity: item.quantity,
        remarks: item.remarks || "",
        isUpdate: true,
      }));
      setPrProduct(data);
    }
  }, [pagination.data]);

  // FIXED: Handle weight change properly
  const handleWeightChange = (id, rawValue, formattedValue) => {
    // rawValue is already a clean number without commas from NumericFormat
    const numericValue = rawValue || 0;
    const isValidQuantity = numericValue > 0 && numericValue >= 0.01;

    const updatedItems = formValues.orderItems.map((oi) =>
      oi.id === id
        ? {
            ...oi,
            displayWeight: formattedValue || "", // Store formatted value for display
            rawWeight: rawValue, // Store the clean numeric value for calculations
            isValidQuantity: isValidQuantity,
          }
        : oi
    );

    setFormValues({
      ...formValues,
      orderItems: updatedItems,
    });
  };

  // Custom input for DatePicker to match vendor component
  const CustomInput = React.forwardRef(
    ({ value, onClick, isInvalid, readOnly }, ref) => (
      <div className="position-relative">
        <input
          type="text"
          className={`form-control w-100 ${
            isInvalid ? "is-invalid border-danger" : ""
          }`}
          style={{
            cursor: readOnly ? "default" : "pointer",
            backgroundColor: readOnly ? "#E9ECEF" : "#fff",
            color: "#000",
            backgroundImage: "none",
          }}
          onClick={readOnly ? undefined : onClick}
          value={value}
          ref={ref}
          required
          placeholder="Select Date"
          readOnly
        />
        <span
          onClick={readOnly ? undefined : onClick}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: readOnly ? "default" : "pointer",
            zIndex: 2,
            color: readOnly ? "#6c757d" : "#000",
          }}
        >
          <i className="fas fa-calendar-alt"></i>
        </span>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="h-100 w-100 border bg-white custom-container">
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseRequest) {
    return (
      <div className="h-100 w-100 border bg-white custom-container">
        <div className="d-flex justify-content-center align-items-center h-100">
          <p>Purchase request not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/purchases/purchase-request")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">PURCHASE REQUEST DETAILS </span>
          </span>
        </div>
      </div>

      <Form noValidate onSubmit={handleSaveChanges}>
        <div className="container-fluid mt-4">
          <div className="row mb-3">
            <div className="col-sm">
              <label htmlFor="pr_no">PR NO.</label>
              <input
                type="text"
                className="form-control"
                id="pr_no"
                name="pr_no"
                value={purchaseRequest.pr_no || ""}
                readOnly
                required
              />
            </div>
            <div className="col-sm">
              <label htmlFor="requestName">
                Request Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${
                  validated && !formValues.request_name.trim()
                    ? "is-invalid"
                    : ""
                }`}
                id="requestName"
                name="requestName"
                value={formValues.request_name}
                onChange={(e) =>
                  setFormValues({ ...formValues, request_name: e.target.value })
                }
                placeholder="Enter Title"
                required
                readOnly={!isEditing}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-sm">
              <label htmlFor="dateNeeded">
                Date Needed <span className="text-danger">*</span>
              </label>
              <DatePicker
                selected={dateNeeded}
                onChange={(date) => setDateNeeded(date)}
                dateFormat="MMM dd, yyyy"
                placeholderText="Select Date"
                required
                id="dateNeeded"
                name="date_needed"
                customInput={
                  <CustomInput
                    isInvalid={validated && !dateNeeded}
                    readOnly={!isEditing}
                  />
                }
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                readOnly={!isEditing}
                disabled={!isEditing}
                className="form-control p-2"
              />
            </div>
            <div className="col-sm">
              <label htmlFor="remarks">Remarks</label>
              <textarea
                name="remarks"
                id="remarks"
                cols="5"
                rows="5"
                className="form-control"
                value={formValues.remarks}
                onChange={(e) =>
                  setFormValues({ ...formValues, remarks: e.target.value })
                }
                readOnly={!isEditing}
              />
            </div>
            {purchaseRequest.status === "Declined" && (
              <div className="col-sm">
                <label className="">Decline Remarks</label>
                <textarea
                  name="remarks"
                  id="remarks"
                  cols="5"
                  rows="5"
                  className="form-control"
                  value={purchaseRequest.rejectRemarks || ""}
                  readOnly
                />
              </div>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="container-fluid mt-4">
          <div className="w-100 d-flex align-items-center">
            <span>Order Items</span>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="container-fluid mt-3">
            <div className="table-responsive data-table scrollable-contents">
              <table
                className="table table-hover table-responsive"
                id="purchaseRequestProductListTable"
              >
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PRODUCT ID
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      PRODUCT NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>

                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      CATEGORY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      UNIT OF MEASURE
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      WEIGHT <span className="text-danger me-1">*</span>
                      <i className="fas fa-sort ms-1"></i>
                    </th>

                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      REMARKS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      {/* Empty header for delete button */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.loading ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : pagination.error ? (
                    <tr>
                      <td colSpan="7" className="text-center text-danger">
                        Error loading data
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    prProduct
                      .filter((data) => data.isUpdate)
                      .map((item) => {
                        const orderItem = formValues.orderItems.find(
                          (oi) => oi.id === item.id
                        );

                        return (
                          <tr key={item.id}>
                            <td>{item.product_code}</td>
                            <td>{item.product_name}</td>

                            <td>{item.category}</td>
                            <td>{item.uom || ""}</td>
                            <td>
                              <NumericFormat
                                className={`form-control ${
                                  validated &&
                                  orderItem &&
                                  !orderItem.isValidQuantity
                                    ? "is-invalid"
                                    : ""
                                }`}
                                value={orderItem?.displayWeight || ""}
                                thousandSeparator={true}
                                onValueChange={(values) => {
                                  handleWeightChange(
                                    item.id,
                                    values.floatValue || 0,
                                    values.formattedValue
                                  );
                                }}
                                isAllowed={(values) => {
                                  const { floatValue } = values;
                                  return (
                                    floatValue === undefined ||
                                    (floatValue >= 0 &&
                                      floatValue <= 9999999999)
                                  );
                                }}
                                placeholder="0"
                                readOnly={!isEditing}
                                decimalScale={2}
                              />
                              {validated &&
                                orderItem &&
                                !orderItem.isValidQuantity && (
                                  <div className="invalid-feedback d-block">
                                    Weight must be greater than 0
                                  </div>
                                )}
                            </td>

                            <td>
                              <textarea
                                className="form-control"
                                cols="1"
                                rows="1"
                                value={orderItem?.remarks || ""}
                                onChange={(e) => {
                                  const updatedItems =
                                    formValues.orderItems.map((oi) =>
                                      oi.id === item.id
                                        ? { ...oi, remarks: e.target.value }
                                        : oi
                                    );
                                  setFormValues({
                                    ...formValues,
                                    orderItems: updatedItems,
                                  });
                                }}
                                readOnly={!isEditing}
                              />
                            </td>
                            <td>
                              <div className="d-flex flex-row align-items-center justify-content-center">
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={(e) => handleProductList(e, item.id)}
                                  disabled={!isEditing}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls {...pagination} />
          </div>
        </div>

        <div className="container-fluid mt-5 d-flex flex-row align-items-center justify-content-end">
          {purchaseRequest.status !== "Declined" && (
            <div className="d-flex flex-row">
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Make Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger mx-3"
                    onClick={showRejectModal}
                  >
                    Decline
                  </button>

                  {authrztn?.includes("PurchaseRequest-Approve") && (
                    <>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={showApproveModal}
                      >
                        Approve
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setValidated(false);
                      reloadTable();
                    }}
                  >
                    Cancel Changes
                  </button>
                  <button type="submit" className="btn btn-primary mx-3">
                    Save Changes
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </Form>

      {/* reject Modal */}
      <Modal show={showModal} onHide={handleClose} backdrop="static">
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={rejectValidated} onSubmit={handleReject}>
            <h6 className="mb-3">
              Are you sure you want to decline purchase request?
            </h6>
            <Form.Group className="mb-3">
              <label htmlFor="rejectRemarks">Remarks</label>
              <textarea
                name=""
                id="rejectRemarks"
                cols="5"
                rows="5"
                className="form-control"
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
              ></textarea>
            </Form.Group>

            <Modal.Footer className="p-0 border-0">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleClose}
              >
                Close
              </Button>

              <Button variant="primary" type="submit">
                Save
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showModal2} onHide={handleClose} backdrop="static">
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            noValidate
            validated={approveValidated}
            onSubmit={handleApprove}
          >
            <h6 className="mb-3">
              Are you sure you want to approve purchase request?
            </h6>

            <Form.Group className="mb-3">
              <label htmlFor="approveRemarks">Remarks</label>
              <textarea
                name=""
                id="approveRemarks"
                cols="5"
                rows="5"
                className="form-control"
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
              ></textarea>
            </Form.Group>

            <Modal.Footer className="p-0 border-0">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleClose}
              >
                No
              </Button>

              <Button variant="primary" type="submit">
                Yes
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};
export default Purchase_request_update;
