import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import { useSort } from "../../../hooks/customHook/tableSort"; // adjust path accordingly

import "../../../assets/css/lionchem.css";

const SampleProductCreate = () => {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [products, setProducts] = useState([]); // State for product list
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // ##### filter #####
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [filterStatus, setFilterStatus] = useState("Active");
  const [filterDateCreated, setFilterDateCreated] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [confirmationRemarks, setConfirmationRemarks] = useState("");

  const userLoggedID = useDecodeToken();

  const handleFilter = () => {
    // setPaginationUrl(BASE_URL + "/Packaging/fetchFilteredData");
    // pagination.updateParams({ filterStatus, filterDateCreated });
  };

  const handleClearFilter = () => {
    // setPaginationUrl(BASE_URL + "/Packaging/fetchData");
    // pagination.updateParams({});
    clearDataInputs();
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // if (value === "") {
    //   setPaginationUrl(BASE_URL + "/Packaging/fetchData");
    //   pagination.updateParams({}); // Reset the filter when search text is empty
    // } else {
    //   setPaginationUrl(BASE_URL + "/Packaging/fetchSearchData");
    //   pagination.updateParams({
    //     searchText: value,
    //     filterColumn,
    //     filterStatus,
    //   });
    // }
  };
  // ##### filter end #####

  const clearDataInputs = () => {
    setSearchText("");
    setFilterColumn("all");
    setFilterStatus("All");
  };

  // ### add ###
  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    setValidated(true);
  };
  // ### add end ###

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/SampleProduct/getProductData`
        );
        setProducts(response.data.data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        swal("Error", "Failed to fetch products", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Form rows state
  const [rows, setRows] = useState([
    {
      id: 1,
      productId: "",
      productCode: "",
      productName: "",
      totalStock: 0,
      quantity: "",
      productRemarks: "",
      packagingName: "",
      isProductSelected: false,
    },
  ]);

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
        totalStock: 0,
        quantity: "",
        productRemarks: "",
        packagingName: "",
        isProductSelected: false,
      },
    ]);
  };

  const deleteRow = (id) => {
    if (rows.length <= 1) {
      swal("Warning", "You must have at least one item", "warning");
      return;
    }
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleProductChange = (id, productId) => {
    const selectedProduct = products.find(
      (product) => product.product_id === productId
    );

    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            productId,
            productCode: selectedProduct?.product_code || "",
            productName: selectedProduct?.product_name || "",
            totalStock: selectedProduct?.total_stock || 0,
            packagingName: selectedProduct?.packaging?.packaging_name || "",
            isProductSelected: !!selectedProduct,
          };
        }
        return row;
      })
    );
  };

  const getAvailableProducts = (currentRowId) => {
    const selectedProductIds = rows
      .filter((row) => row.id !== currentRowId && row.productId)
      .map((row) => row.productId);

    return products.filter(
      (product) => !selectedProductIds.includes(product.product_id)
    );
  };

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

    setRows(
      rows.map((row) =>
        row.id === id ? { ...row, quantity: formattedValue } : row
      )
    );
  };

  const handleInputChange = (id, field, value) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };
  // fetch customer
  const [customerData, setCustomerData] = useState([]);
  const fetchCustomer = () => {
    axios.get(BASE_URL + "/SampleProduct/getCustomer").then((res) => {
      setCustomerData(res.data);
    });
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  // confirmation
  // Modal state
  const [approveModal, setApproveModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Fetch products and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, customersRes] = await Promise.all([
          axios.get(`${BASE_URL}/SampleProduct/getProductData`),
          axios.get(`${BASE_URL}/SampleProduct/getCustomer`),
        ]);
        setProducts(productsRes.data.data || []);
        setCustomerData(customersRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        swal("Error", "Failed to fetch data", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Validation function
  const validateForm = () => {
    // Validate customer selection
    if (!customerId) {
      document.getElementById("customerName").classList.add("is-invalid");
      swal("Validation Error", "Please select a customer", "error");
      return false;
    }

    // Validate each row
    let isValid = true;
    const updatedRows = rows.map((row) => {
      const newRow = { ...row };

      // Validate product selection
      if (!row.productId) {
        isValid = false;
        document
          .querySelector(`select[value="${row.id}"]`)
          ?.classList.add("is-invalid");
      }

      // Validate quantity
      if (!row.quantity || parseFloat(row.quantity.replace(/,/g, "")) <= 0) {
        isValid = false;
        document
          .querySelector(
            `input[data-row-id="${row.id}"][data-field="quantity"]`
          )
          ?.classList.add("is-invalid");
      }

      return newRow;
    });

    if (!isValid) {
      swal("Validation Error", "Please fill out all required fields", "error");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Clear previous validation
    document
      .querySelectorAll(".is-invalid")
      .forEach((el) => el.classList.remove("is-invalid"));

    if (!validateForm()) {
      return;
    }

    // Show confirmation modal if validation passes
    setApproveModal(true);
  };

  // Handle final confirmation
  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsApproving(true);

    try {
      // Prepare data for submission
      const submissionData = {
        customer_id: customerId,
        remarks,
        userLoggedID: userLoggedID,
        confirmation_remarks: confirmationRemarks,
        products: rows.map((row) => ({
          product_id: row.productId,
          total_stock: row.totalStock,
          quantity: parseFloat(row.quantity.replace(/,/g, "")),
          product_remarks: row.productRemarks,
        })),
      };

      const response = await axios.post(
        `${BASE_URL}/SampleProduct/create`,
        submissionData
      );
      if (response.status === 200) {
        swal({
          title: "Success!",
          text: "Sample Product has been added successfully.",
          icon: "success",
          button: false,
          timer: 2500,
        }).then(() => {
          navigate("/sales/sample-product");
        });
      } else {
        swal({
          title: "Error",
          text: "There is an error inserting, try again.",
          icon: "error",
          button: true,
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      swal("Error", "Failed to submit sample product request", "error");
    } finally {
      setIsApproving(false);
      setApproveModal(false);
    }
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom2">
          <span className="fs-3">
            <button
              onClick={() => navigate("/sales/sample-product")}
              className="text-dark border-0"
              style={{ background: "none" }}
            >
              <i className="bx bx-arrow-back"></i>
            </button>
            <span className="mx-2">CREATE SAMPLE PRODUCTS</span>
          </span>
          {/* <span>PRODUCT LIST SAMPLE PRODUCTS</span> */}
        </div>

        <div></div>
      </div>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <div className="container-fluid mt-4">
          <div className="row w-100 mt-3">
            <div className="col-12 col-md-4">
              <Form.Group className="mb-3" controlId="customerName">
                <Form.Label>
                  Customer <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  isInvalid={validated && !customerId}
                >
                  <option value="">Select Customer</option>
                  {customerData.map((item, index) => (
                    <option key={index} value={item.customer_id}>
                      {item.company_name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Please select a customer
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="col-12 col-md-8">
              <Form.Group className="mb-3" controlId="remarks">
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter Remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </Form.Group>
            </div>
          </div>

          <div className="w-100 d-flex align-items-center mt-4">
            <span>Product List</span>
            <hr className="flex-grow-1 mx-3" />
          </div>

          <div className="w-100 mt-4">
            <table
              className="table-responsive table table-bordered table-hover"
              id="sampleProductCreateTable"
            >
              <thead className="table-light">
                <tr>
                  <th className="p-2">PRODUCT CODE</th>
                  <th className="p-2">
                    PRODUCT NAME <span className="text-danger">*</span>
                  </th>
                  <th className="p-2">UOM</th>
                  <th className="p-2">STOCK</th>
                  <th className="p-2">
                    QUANTITY <span className="text-danger">*</span>
                  </th>
                  <th className="p-2">PRODUCT REMARKS</th>
                  <th className="p-2" style={{ width: "50px" }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        value={row.productCode}
                        title={row.productCode}
                      />
                    </td>
                    <td>
                      {isLoading ? (
                        <div className="text-center">
                          <div
                            className="spinner-border spinner-border-sm"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : (
                        <select
                          className="form-select"
                          value={row.productId}
                          required
                          onChange={(e) =>
                            handleProductChange(row.id, e.target.value)
                          }
                        >
                          <option value="" disabled>
                            Select Product
                          </option>
                          {getAvailableProducts(row.id).map((product) => (
                            <option
                              key={product.product_id}
                              value={product.product_id}
                            >
                              {product.product_name}
                            </option>
                          ))}
                          {row.productId &&
                            !getAvailableProducts(row.id).some(
                              (p) => p.product_id === row.productId
                            ) && (
                              <option value={row.productId} disabled>
                                {products.find(
                                  (p) => p.product_id === row.productId
                                )?.product_name || "Selected Product"}
                              </option>
                            )}
                        </select>
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        value={row.packagingName}
                        title={row.packagingName}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        readOnly
                        value={
                          row.totalStock !== 0 && !isNaN(row.totalStock)
                            ? Number(row.totalStock).toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })
                            : 0
                        }
                        title={
                          row.totalStock !== 0 && !isNaN(row.totalStock)
                            ? Number(row.totalStock).toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })
                            : 0
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="0.0"
                        value={row.quantity}
                        required
                        readOnly={!row.isProductSelected}
                        onChange={(e) =>
                          handleQuantityChange(row.id, e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <textarea
                        className="form-control"
                        cols="1"
                        rows="1"
                        value={row.productRemarks}
                        readOnly={!row.isProductSelected}
                        onChange={(e) =>
                          handleInputChange(
                            row.id,
                            "productRemarks",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td className="text-center" style={{ width: "50px" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteRow(row.id)}
                        title="Remove"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
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
            <a
              className="btn btn-outline-secondary mx-2"
              style={{ padding: "0.7rem 1.7rem" }}
              href="/sales/sample-product"
            >
              Cancel
            </a>
            <button
              className="btn btn-primary"
              style={{ padding: "0.7rem 1.7rem" }}
              type="submit"
            >
              Submit
            </button>
          </div>
        </div>
      </Form>

      {/* confirmation modal */}
      <Modal
        show={approveModal}
        onHide={() => setApproveModal(false)}
        backdrop="static"
      >
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleConfirm}>
            <h6 className="mb-3">Are you sure you want to submit?</h6>

            <Form.Group className="mb-3">
              <Form.Label>Confirmation Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={confirmationRemarks}
                onChange={(e) => setConfirmationRemarks(e.target.value)}
              />
            </Form.Group>

            <Modal.Footer className="p-0 border-0 mt-2">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={() => setApproveModal(false)}
                disabled={isApproving}
              >
                No
              </Button>

              <Button variant="primary" type="submit" disabled={isApproving}>
                {isApproving ? "Submitting..." : "Yes"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SampleProductCreate;
