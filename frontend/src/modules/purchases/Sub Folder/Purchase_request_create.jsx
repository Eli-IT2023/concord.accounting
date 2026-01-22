import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import "../../../assets/css/lionchem.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import Select from "react-select";
import { FaCalendarAlt } from "react-icons/fa"; // Add this import at the top

const Purchase_request_create = () => {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prNo, setPrNo] = useState("");
  const [dateNeeded, setDateNeeded] = useState(null);
  const [requestName, setRequestName] = useState("");

  // datepicker custom input to prevent typing
  const CustomInput = React.forwardRef(({ value, onClick, isInvalid }, ref) => (
    <div className="position-relative">
      <input
        type="text"
        className={`form-control w-100 ${
          isInvalid ? "is-invalid border-danger" : ""
        }`}
        style={{
          cursor: "pointer",
          backgroundColor: "#fff",
          color: "#000",
          backgroundImage: "none", // Added to match vendor
        }}
        onClick={onClick}
        value={value}
        ref={ref}
        required
        placeholder="Select Date"
        readOnly
      />
      <span
        onClick={onClick}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        <FaCalendarAlt />
      </span>
    </div>
  ));

  // ### Generate PR number ###
  useEffect(() => {
    generatePrNumber();
  }, []);

  const generatePrNumber = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const datetimeStr = `${year}${month}${day}${hours}${minutes}${seconds}`;
    const generatedPrNo = `PR-${datetimeStr}${randomNum}`;
    setPrNo(generatedPrNo);
  };

  // ### Fetch products ###
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/product/getProductData`);
        const rawMaterials = response.data.filter(
          (product) => product.product_category === "Raw Materials"
        );

        // Transform products for react-select - include all necessary fields
        const transformedProducts = rawMaterials.map((product) => ({
          value: product.product_id,
          label: product.product_name,
          product_code: product.product_code,
          product_category: product.product_category, // Make sure this is included
          category: product.product_category, // Keep both for consistency
          uom: product.prod_packaging,
          originalProduct: product,
        }));

        setProducts(transformedProducts);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        swal("Error", "Failed to fetch products", "error");
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    console.log(products, "THIS IS THE PRODUCTS DATA");
  }, [products]);

  // Table rows state
  const [rows, setRows] = useState([
    {
      id: 1,
      productId: "",
      productCode: "",
      productName: "",
      category: "",
      uom: "",
      quantity: "",
      remarks: "",
      isProductSelected: false,
      isValidQuantity: true,
      isProductValid: true,
    },
  ]);

  // Function to add a new row
  const addNewRow = () => {
    const newId =
      rows.length > 0 ? Math.max(...rows.map((row) => row.id)) + 1 : 1;
    setRows([
      ...rows,
      {
        id: newId,
        productId: "",
        productCode: "",
        productName: "",
        category: "",
        quantity: "",
        remarks: "",
        isProductSelected: false,
        isValidQuantity: true,
        isProductValid: true,
      },
    ]);
  };

  // Function to delete a row
  const deleteRow = (id) => {
    if (rows.length <= 1) {
      swal("Warning", "You must have at least one item", "warning");
      return;
    }
    setRows(rows.filter((row) => row.id !== id));
  };

  // Handle product selection change with react-select
  const handleProductChange = (id, selectedOption) => {
    const selectedProduct = selectedOption
      ? products.find((product) => product.value === selectedOption.value)
      : null;

    const uom = selectedProduct?.uom;
    const uomString = uom
      ? `${uom.packaging_name} - (${uom.unit_quantity}${uom.unit})`
      : "";

    const isProductValid = !!selectedOption;

    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            productId: selectedOption?.value || "",
            productCode: selectedProduct?.product_code || "",
            productName: selectedProduct?.label || "",
            category:
              selectedProduct?.product_category ||
              selectedProduct?.category ||
              "", // Fixed this line
            uom: uomString || "",
            unit_quantity: selectedProduct?.uom?.unit_quantity || 1, // Added fallback
            isProductSelected: !!selectedProduct,
            isProductValid: isProductValid,
            isValidQuantity: true,
          };
        }
        return row;
      })
    );
  };

  // Add this function to filter available products for react-select
  const getAvailableProducts = (currentRowId) => {
    const selectedProductIds = rows
      .filter((row) => row.id !== currentRowId && row.productId)
      .map((row) => row.productId);

    return products.filter(
      (product) => !selectedProductIds.includes(product.value)
    );
  };

  // Custom styles for react-select to match your form styling
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused
        ? "#86b7fe"
        : validated && state.selectProps.isInvalid
        ? "#dc3545"
        : "#dee2e6",
      boxShadow: state.isFocused
        ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
        : "none",
      "&:hover": {
        borderColor: state.isFocused
          ? "#86b7fe"
          : validated && state.selectProps.isInvalid
          ? "#dc3545"
          : "#adb5bd",
      },
      minHeight: "38px",
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    placeholder: (base) => ({
      ...base,
      color: "#6c757d",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#0d6efd"
        : state.isFocused
        ? "#e9ecef"
        : "white",
      color: state.isSelected ? "white" : "black",
    }),
  };

  // Custom Option component to show category in dropdown
  const CustomOption = (props) => {
    const { data, innerRef, innerProps } = props;
    return (
      <div className="p-2 border-bottom">
        <div ref={innerRef} {...innerProps} className="fw-semibold">
          {data.label}
        </div>
      </div>
    );
  };

  // Custom NoOptionsMessage component
  const NoOptionsMessage = (props) => {
    return (
      <div
        {...props.innerProps}
        style={{
          ...props.getStyles("noOptionsMessage", props),
          padding: "8px 12px",
          textAlign: "center",
          color: "#6c757d",
        }}
      >
        No option available
      </div>
    );
  };

  // Custom SingleValue component to show selected value with category
  const CustomSingleValue = (props) => {
    const { data } = props;
    return <span className="fw-semibold">{data.label}</span>;
  };

  // ### decimal validation ###
  const handleQuantityChange = (id, value) => {
    let inputValue = String(value).replace(/[^0-9.]/g, "");
    let [integerPart, decimalPart] = inputValue.split(".");

    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    if (decimalPart !== undefined) {
      decimalPart = decimalPart.substring(0, 2);
    }

    const formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    const numericValue = parseFloat(formattedValue.replace(/,/g, ""));
    const isValidQuantity = numericValue > 0 && numericValue >= 0.01;

    setRows(
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              quantity: formattedValue,
              isValidQuantity: isValidQuantity,
            }
          : row
      )
    );
  };

  // Handle input changes
  const handleInputChange = (id, field, value) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Validate all rows before submission
  const validateRows = () => {
    let isValid = true;
    const updatedRows = rows.map((row) => {
      const isProductValid = !!row.productId;
      let isValidQuantity = true;

      if (row.isProductSelected) {
        const numericValue = parseFloat(row.quantity.replace(/,/g, ""));
        isValidQuantity = numericValue > 0 && numericValue >= 0.01;
      }

      if (!isProductValid || !isValidQuantity) {
        isValid = false;
      }

      return {
        ...row,
        isProductValid: isProductValid,
        isValidQuantity: isValidQuantity,
      };
    });

    setRows(updatedRows);
    return isValid;
  };

  // Check if main form fields are valid
  const areMainFieldsValid = () => {
    return requestName.trim() !== "" && dateNeeded !== null;
  };

  // ### add ###
  const userLoggedID = useDecodeToken();

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    const areRowsValid = validateRows();
    const areMainValid = areMainFieldsValid();

    if (form.checkValidity() === false || !areMainValid) {
      e.preventDefault();
      e.stopPropagation();

      let errorMessage = "Please fill all required fields";
      swal({
        icon: "warning",
        title: "Fields are required",
        text: errorMessage,
      });
      setValidated(true);
      return;
    }

    if (!areRowsValid) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "warning",
        title: "Validation",
        text: "Quantity must be greater than 0",
      });
      return;
    }

    try {
      const confirmed = await swal({
        title: "Create this new request?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      });

      if (confirmed) {
        // Format date for display (frontend): MMM dd, yyyy
        // Format date for backend: yyyy-MM-dd
        const formattedDateNeeded = dateNeeded
          ? format(dateNeeded, "yyyy-MM-dd") // Keep this for backend
          : null;

        const formData = {
          userLoggedID: userLoggedID,
          pr_no: prNo,
          date_needed: formattedDateNeeded, // Backend format: 2025-08-01
          remarks: e.target.remarks.value,
          request_name: requestName,
          items: rows.map((row) => ({
            product_id: row.productId,
            product_code: row.productCode,
            product_name: row.productName,
            quantity: row.quantity.replace(/,/g, ""),
            price: 0,
            remarks: row.remarks,
            unit_quantity: row.unit_quantity || 1,
            uom: row.uom || "",
          })),
        };

        // Add this to see what's being sent
        console.log("Form data being sent:", formData);

        const response = await axios.post(
          BASE_URL + "/PurchaseRequest/create",
          formData
        );

        if (response.data.success) {
          swal({
            title: "Success!",
            text: "Purchase request created successfully",
            icon: "success",
            button: false,
            timer: 2500,
          }).then(() => {
            navigate("/purchases/purchase-request");
          });
        } else {
          throw new Error(
            response.data.message || "Failed to create purchase request"
          );
        }
      }
    } catch (error) {
      swal({
        title: "Error!",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to create purchase request",
        icon: "error",
      });
    }

    setValidated(true);
  };

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
            <span className="mx-2">PURCHASE REQUEST FORM</span>
          </span>
        </div>
      </div>

      <Form noValidate onSubmit={add}>
        <div className="container-fluid mt-4">
          <div className="row mb-3">
            <div className="col-sm">
              <label htmlFor="pr_no">PR NO.</label>
              <input
                type="text"
                className="form-control"
                id="pr_no"
                name="pr_no"
                value={prNo}
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
                  validated && !requestName.trim() ? "is-invalid" : ""
                }`}
                id="requestName"
                name="requestName"
                placeholder="Enter Title"
                required
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
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
                dateFormat="MMM dd, yyyy" // Changed to match vendor format
                placeholderText="Select Date"
                required
                id="dateNeeded"
                name="date_needed"
                customInput={
                  <CustomInput isInvalid={validated && !dateNeeded} />
                }
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                popperPlacement="bottom"
                popperProps={{
                  positionFixed: true,
                }}
                // Add these props to match vendor component
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
              ></textarea>
            </div>
          </div>
        </div>

        <div className="container-fluid mt-4">
          <div className="w-100 d-flex align-items-center">
            <span>Order Items</span>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="w-100 mt-4">
            <table
              className="table-responsive table table-bordered table-hover"
              id="purchaseRequestCreateTable"
            >
              <thead className="table-light">
                <tr>
                  <th className="p-2 text-center">PRODUCT CODE</th>
                  <th className="p-2 text-center">
                    PRODUCT NAME <span className="text-danger">*</span>
                  </th>
                  <th className="p-2 text-center">CATEGORY</th>
                  <th className="p-2 text-center">UNIT OF MEASURE</th>
                  <th className="p-2 text-center">
                    WEIGHT <span className="text-danger">*</span>
                  </th>
                  <th className="p-2 text-center d-none">PRICE</th>
                  <th className="p-2 text-center">REMARKS</th>
                  <th
                    className="p-2 text-center"
                    style={{ width: "50px" }}
                  ></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const availableProducts = getAvailableProducts(row.id);
                  const currentSelectedProduct = row.productId
                    ? products.find((p) => p.value === row.productId)
                    : null;

                  return (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={row.productCode}
                        />
                      </td>
                      <td>
                        {isLoading ? (
                          <div className="text-center">
                            <div
                              className="spinner-border spinner-border-sm"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                          </div>
                        ) : (
                          <Select
                            options={availableProducts}
                            value={currentSelectedProduct}
                            onChange={(selectedOption) =>
                              handleProductChange(row.id, selectedOption)
                            }
                            isSearchable={true}
                            placeholder="Select Product"
                            styles={customSelectStyles}
                            isInvalid={validated && !row.isProductValid}
                            components={{ NoOptionsMessage }}
                            isDisabled={isLoading}
                          />
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={row.category}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          readOnly
                          value={row.uom}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={`form-control ${
                            validated && (!row.isValidQuantity || !row.quantity)
                              ? "is-invalid"
                              : ""
                          }`}
                          placeholder="0.00"
                          maxLength={12}
                          value={row.quantity}
                          required={row.isProductSelected}
                          readOnly={!row.isProductSelected}
                          onChange={(e) =>
                            handleQuantityChange(row.id, e.target.value)
                          }
                          style={{
                            borderColor:
                              validated &&
                              (!row.isValidQuantity || !row.quantity)
                                ? "#dc3545"
                                : "",
                          }}
                        />
                        {/* {validated &&
                          (!row.isValidQuantity || !row.quantity) && (
                            <div className="invalid-feedback d-block">
                              Weight must be greater than 0
                            </div>
                          )} */}
                      </td>
                      <td className="d-none">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="0.0"
                          value="0"
                        />
                      </td>
                      <td>
                        <textarea
                          className="form-control"
                          cols="1"
                          rows="1"
                          value={row.remarks}
                          readOnly={!row.isProductSelected}
                          onChange={(e) =>
                            handleInputChange(row.id, "remarks", e.target.value)
                          }
                        />
                      </td>
                      <td className="text-center" style={{ width: "50px" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteRow(row.id)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-end mt-2">
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={addNewRow}
            >
              New Item
            </button>
          </div>

          <div className="text-end mt-5">
            <button
              onClick={() => {
                navigate(`/purchases/purchase-request/`);
                window.scrollTo(0, 0);
              }}
              className="btn btn-outline-secondary mx-2"
              type="button"
            >
              Cancel
            </button>
            <button className="btn btn-primary">Submit</button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default Purchase_request_create;
