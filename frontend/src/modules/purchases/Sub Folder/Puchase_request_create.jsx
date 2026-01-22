import { React, useState, useEffect } from "react";
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

const Purchase_request_create = () => {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [products, setProducts] = useState([]); // State for product list
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [prNo, setPrNo] = useState(""); // State for PR numbe3

  // ### Generate PR number ###
  useEffect(() => {
    generatePrNumber();
  }, []);

  // Function to generate PR number
  const generatePrNumber = () => {
    // Generate random 3-digit number (100-999)
    const randomNum = Math.floor(100 + Math.random() * 900);

    // Get current datetime in YYYYMMDDHHMMSS format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const datetimeStr = `${year}${month}${day}${hours}${minutes}${seconds}`;

    // Combine all parts
    const generatedPrNo = `PR - ${randomNum} - ${datetimeStr}`;
    setPrNo(generatedPrNo);
  };

  // ### end of generate PR ####

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/product/getProductData`);
        setProducts(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        swal("Error", "Failed to fetch products", "error");
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ### Fetch products ###
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/product/getProductData`);
        setProducts(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        swal("Error", "Failed to fetch products", "error");
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);
  //   ### fetch product end ###

  // ### add ###
  const add = async (e) => {
    e.preventDefault();
    setValidated(true);
  };

  // Table rows state
  const [rows, setRows] = useState([
    {
      id: 1,
      productId: "",
      productCode: "",
      productName: "",
      quantity: "",
      remarks: "",
      isProductSelected: false, // Track if product is selected
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
        quantity: "",
        remarks: "",
        isProductSelected: false,
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

  // Handle product selection change
  const handleProductChange = (id, productId) => {
    const selectedProduct = products.find(
      (product) => product.product_id === productId
    );

    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return {
            ...row,
            productId: productId,
            productCode: selectedProduct?.product_code || "",
            productName: selectedProduct?.product_name || "",
            isProductSelected: !!selectedProduct,
          };
        }
        return row;
      })
    );
  };

  // ### decimal validation ###
  const handleQuantityChange = (id, value) => {
    // Allow only numbers and decimal point
    let inputValue = String(value).replace(/[^0-9.]/g, "");

    // Split into integer and decimal parts
    let [integerPart, decimalPart] = inputValue.split(".");

    // Format integer part with commas
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Limit decimal places to 2 if they exist
    if (decimalPart !== undefined) {
      decimalPart = decimalPart.substring(0, 2);
    }

    // Combine the parts
    const formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setRows(
      rows.map((row) =>
        row.id === id ? { ...row, quantity: formattedValue } : row
      )
    );
  };

  const handlePriceChange = (id, value) => {
    // Allow only numbers and decimal point
    let inputValue = String(value).replace(/[^0-9.]/g, "");

    // Split into integer and decimal parts
    let [integerPart, decimalPart] = inputValue.split(".");

    // Format integer part with commas
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Limit decimal places to 2 if they exist
    if (decimalPart !== undefined) {
      decimalPart = decimalPart.substring(0, 2);
    }

    // Combine the parts
    const formattedValue =
      decimalPart !== undefined ? `${integerPart}.${decimalPart}` : integerPart;

    setRows(
      rows.map((row) =>
        row.id === id ? { ...row, price: formattedValue } : row
      )
    );
  };

  // ### decimal validation end ###

  // Handle input changes
  const handleInputChange = (id, field, value) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
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
      <Form noValidate validated={validated} onSubmit={add}>
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
              <label htmlFor="dateNeeded">Date Needed</label>
              <input
                type="date"
                className="form-control"
                id="dateNeeded"
                name="date_needed"
                required
              />
            </div>
          </div>
          <div className="row">
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
            <div className="col-sm"></div>
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
                  <th className="p-2">PRODUCT CODE</th>
                  <th className="p-2">PRODUCT NAME</th>
                  <th className="p-2">QUANTITY</th>
                  <th className="p-2">PRICE</th>
                  <th className="p-2">REMARKS</th>
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
                          {products.map((product) => (
                            <option
                              key={product.product_id}
                              value={product.product_id}
                            >
                              {product.product_name}
                            </option>
                          ))}
                        </select>
                      )}
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
                      <input
                        type="text"
                        className="form-control"
                        placeholder="0.0"
                        value={row.price}
                        required
                        readOnly={!row.isProductSelected}
                        onChange={(e) =>
                          handlePriceChange(row.id, e.target.value)
                        }
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
            <button
              onClick={() => navigate("/purchases/purchase-request")}
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
