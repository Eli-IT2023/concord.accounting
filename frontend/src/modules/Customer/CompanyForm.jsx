import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import { NumericFormat } from "react-number-format";
import axios from "axios";
import swal from "sweetalert";
import {
  CollapsibleContainer,
  useCollapsibleSections,
} from "../../hooks/customHook/useCollapsibleSections";
import BASE_URL from "../../assets/global/url";
import PropTypes from "prop-types";
import Select from "react-select";

const CompanyForm = ({
  id,
  countryOptions,
  setCompanyAddress,
  companyAddress,
  setCountry,
  country,
  setMobileNumber,
  mobileNumber,
  setTin,
  tin,
  setCompanyName,
  companyName,
  setCompanyNature,
  companyNature,
  setCompanyEmail,
  companyEmail,
  socialLinks,
  setSocialLinks,
  contactPerson,
  setContactPerson,
  setTelephoneNumber,
  telephoneNumber,
  products,
  setProducts,
  currencyID,
  setCurrencyID,
  paymentMethod,
  setPaymentMethod,
  paymentTerms,
  setPaymentTerms,
  otherPaymentTerms,
  setOtherPaymentTerms,
  roleType,
  vatPercentage,
  setVatPercentage,
  discountPercentage,
  setDiscountPercentage,
  discountIDNo,
  setDiscountIDNo,
}) => {
  const [companyEmailError, setCompanyEmailError] = useState("");
  const [productData, setProductData] = useState([]);
  const { toggleSection, isOpen } = useCollapsibleSections();

  // currency
  const [currency, setCurrency] = useState([]);

  const reloadCurrency = () => {
    axios.get(BASE_URL + "/currency/fetchCurrency").then((res) => {
      setCurrency(res.data);
      // Only set default currency if currencyID is not already set
      if (!currencyID && res.data.length > 0) {
      }
    });
  };

  // Social Links Functions
  const addSocialLink = () => {
    setSocialLinks([
      ...socialLinks,
      { id: uuidv4(), platform: "", link: "", isDeleted: false },
    ]);
  };

  const updateSocialLink = (itemToUpdate, field, value) => {
    setSocialLinks(
      socialLinks.map((item) =>
        item === itemToUpdate ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteSocialLink = (index) => {
    const newLinks = [...socialLinks];
    newLinks[index].isDeleted = true;
    setSocialLinks(newLinks);
  };

  // Contact Person Functions
  const addContact = () => {
    setContactPerson([
      ...contactPerson,
      {
        id: uuidv4(),
        fname: "",
        mname: "",
        lname: "",
        mobileNumber: "",
        email: "",
        jobPosition: "",
        Remarks: "",
        isDeleted: false,
      },
    ]);
  };

  const updateContact = (itemToUpdate, field, value) => {
    setContactPerson(
      contactPerson.map((item) =>
        item === itemToUpdate ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteContact = (index) => {
    const newContacts = [...contactPerson];
    newContacts[index].isDeleted = true;
    setContactPerson(newContacts);
  };

  // Product Functions
  const fetchAllProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/getProductData`);
      setProductData(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const formatPrice = (value) => {
    if (value === undefined || value === null || value === "") return "";

    // Convert to string if it's a number
    let numStr = typeof value === "number" ? value.toString() : value;

    // Remove any existing commas and any non-digit characters except decimal point
    numStr = numStr.replace(/,/g, "").replace(/[^0-9.]/g, "");

    // Handle multiple decimal points by keeping only the first one
    const parts = numStr.split(".");
    if (parts.length > 2) {
      numStr = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    // Split into integer and decimal parts
    const [integerPart, decimalPart] = numStr.split(".");

    // Format only the integer part with commas
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Combine formatted integer with decimal (if exists)
    return decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  };

  const parsePrice = (value) => {
    if (!value) return 0;
    // Remove all commas before parsing
    return parseFloat(value.replace(/,/g, ""));
  };

  const handlePriceChange = (productId, value) => {
    updateProduct(productId, {
      customer_prod_price: value,
      formatted_price: value,
    });
  };

  const getAvailableProducts = (currentProductId = null) => {
    // Get IDs of all products currently assigned to this customer
    const selectedProductIds = products
      .filter(
        (product) =>
          product.prod_id &&
          product.customer_prod_id !== currentProductId &&
          !product.isDeleted
      )
      .map((product) => product.prod_id);

    // Return all products that aren't currently assigned
    return productData.filter(
      (product) => !selectedProductIds.includes(product.product_id)
    );
  };

  const addNewItem = () => {
    const availableProducts = getAvailableProducts();
    if (availableProducts.length === 0) {
      swal({
        title: "No Available Products",
        text: "All products have already been added to this customer.",
        icon: "info",
      });
      return;
    }

    setProducts([
      ...products,
      {
        customer_prod_id: uuidv4(),
        prod_id: "",
        prod_code: "",
        prod_name: "",
        prod_cat: "",
        prod_uom: "",
        customer_product_code: "",
        customer_product_name: "",
        customer_prod_price: 0,
        formatted_price: "0",
        customer_prod_status: "Active",
        type: "new",
        isDeleted: false, // Explicitly set isDeleted to false for new items
      },
    ]);
  };
  const updateProduct = (productId, updates) => {
    setProducts(
      products.map((product) =>
        product.customer_prod_id === productId
          ? { ...product, ...updates }
          : product
      )
    );
  };

  const removeProduct = async (productId, currentStatus) => {
    const productToRemove = products.find(
      (p) => p.customer_prod_id === productId
    );
    if (!productToRemove) return;

    const isNewProduct = productToRemove.type === "new";

    if (isNewProduct) {
      // For new products, just mark as deleted
      setProducts(
        products.map((p) =>
          p.customer_prod_id === productId ? { ...p, isDeleted: true } : p
        )
      );
    } else {
      // For existing products, toggle status
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      const confirmed = await swal({
        title: `Mark product as ${newStatus}?`,
        text: `This will mark the product as ${newStatus.toLowerCase()} for this customer.`,
        icon: "warning",
        buttons: true,
        dangerMode: newStatus === "Inactive",
      });

      if (confirmed) {
        try {
          setProducts(
            products.map((p) =>
              p.customer_prod_id === productId
                ? { ...p, customer_prod_status: newStatus }
                : p
            )
          );

          const response = await axios.post(
            `${BASE_URL}/customer/updateProductStatus`,
            {
              productId: productToRemove.prod_id,
              customerId: id,
              status: newStatus,
            }
          );

          if (!response.data.success) {
            throw new Error("Failed to update on server");
          }
        } catch (error) {
          console.error("Error updating product:", error);
          fetchAllProducts();
          swal("Error", "Failed to update product status", "error");
        }
      }
    }
  };

  useEffect(() => {
    fetchAllProducts();
    reloadCurrency(); // Add this to fetch currencies on load

    // Format existing prices on load
    if (products && Array.isArray(products) && products.length > 0) {
      setProducts(
        products.map((product) => {
          const numericPrice =
            typeof product.customer_prod_price === "string"
              ? parseFloat(product.customer_prod_price.replace(/,/g, ""))
              : product.customer_prod_price;

          return {
            ...product,
            customer_prod_price: numericPrice,
            formatted_price: numericPrice.toLocaleString(),
          };
        })
      );
    }
  }, []);

  // Email validation
  const validateCompanyEmail = (e) => {
    const value = e.target.value;
    setCompanyEmail(value);
    setCompanyEmailError(
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? "Please enter a valid email address."
        : ""
    );
  };

  // for price history
  const handleClose = () => {
    setShowHistoryModal(false);
  };

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerPriceHistoryData, setCustomerPriceHistoryData] = useState([]);

  const handleShowHistory = (
    productId,
    productName,
    productCode,
    currentPrice
  ) => {
    setSelectedProduct({
      productId,
      productName,
      productCode,
      currentPrice,
    });

    // Fetch the price history
    fetchVendorPriceHistory(id, productId); // id is from useParams()

    setShowHistoryModal(true);
  };

  const fetchVendorPriceHistory = (id, productId) => {
    axios
      .get(BASE_URL + "/customer/getCustomerHistory", {
        params: {
          customer_id: id,
          product_id: productId,
        },
      })
      .then((res) => {
        if (res.data) {
          setCustomerPriceHistoryData(res.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching customer history:", error);
      });
  };

  return (
    <>
      {/* Company Form Fields */}
      <div className="row mt-3">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Company Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Enter Name"
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Company Nature</Form.Label>
            <Form.Control
              type="text"
              value={companyNature}
              onChange={(e) => setCompanyNature(e.target.value)}
              placeholder="Enter Nature"
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              value={companyEmail}
              onChange={validateCompanyEmail}
              placeholder="Enter Email"
            />
            {companyEmailError && (
              <div className="text-danger">{companyEmailError}</div>
            )}
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Company Address <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              required
              placeholder="Enter Address"
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3" controlId="basedCountry">
            <Form.Label>Country</Form.Label>
            <Form.Select
              defaultValue="Philippines"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option disabled value="">
                Select Country
              </option>
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3" controlId="basedCurrency">
            <Form.Label>
              Currency <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              required
              value={currencyID || ""} // Ensure empty string if undefined
              onChange={(e) => setCurrencyID(e.target.value)}
            >
              <option value="">Select Currency</option>
              {currency.map((curr) => (
                <option key={curr.id} value={curr.id}>
                  {curr.currency_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Mobile No.</Form.Label>
            <div className="input-group">
              <span className="input-group-text">+63</span>
              <Form.Control
                type="text"
                maxLength={10}
                value={mobileNumber}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Enter mobile number"
              />
            </div>
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Telephone No.</Form.Label>
            <div className="input-group">
              <Form.Control
                type="text"
                maxLength={10}
                value={telephoneNumber}
                onInput={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setTelephoneNumber(e.target.value)}
                placeholder="Enter mobile number"
              />
            </div>
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>TIN</Form.Label>
            <Form.Control
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              placeholder="Enter TIN"
            />
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-4">
          <Form.Group className="mb-3" controlId="vatPercentage">
            <Form.Label>VAT (%)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter VAT"
              value={vatPercentage}
              onChange={(e) => setVatPercentage(e.target.value)}
            />
          </Form.Group>
        </div>

        <div className="col-sm-4">
          <Form.Group className="mb-3" controlId="discountIDNo">
            <Form.Label>SCA/PWD ID No.</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter ID No."
              value={discountIDNo}
              onChange={(e) => setDiscountIDNo(e.target.value)}
            />
          </Form.Group>
        </div>

        <div className="col-sm-4">
          <Form.Group className="mb-3" controlId="discountPercentage">
            <Form.Label>SCA/PWD Discount (%)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Discount"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
            />
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-4">
          <Form.Group className="mb-3" controlId="paymentMethod">
            <Form.Label>Payment Method</Form.Label>
            <Form.Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="" disabled>
                Select Method
              </option>
              <option value="Cash">Cash</option>
              {/* <option value="Online">Online</option> */}
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </Form.Select>
          </Form.Group>
        </div>

        <div className="col-sm-4">
          <Form.Group className="mb-3" controlId="paymentTerms">
            <Form.Label>Payment Terms</Form.Label>
            <Form.Select
              value={paymentTerms}
              onChange={(e) => {
                setPaymentTerms(e.target.value);
              }}
            >
              <option value="" disabled>
                Select Term
              </option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="120">120 Days</option>
              <option value="Other">Other</option>
            </Form.Select>
          </Form.Group>
        </div>

        {paymentTerms === "Other" && (
          <div className="col-sm-4">
            <Form.Group className="mb-3" controlId="otherTerms">
              <Form.Label>Other Term</Form.Label>
              <Form.Control
                type="text"
                value={otherPaymentTerms}
                onChange={(e) => setOtherPaymentTerms(e.target.value)}
                placeholder="Enter specific term"
              />
            </Form.Group>
          </div>
        )}
      </div>

      {/* Product List Section */}
      {id && (
        <div className="row mt-4">
          <CollapsibleContainer
            title="Product List"
            toggleSection={toggleSection}
            isOpen={isOpen}
          >
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Product Category</th>
                    <th>Client Code</th>
                    <th>Client Product Name</th>
                    {roleType?.includes("Management") && <th>Sell Price</th>}
                    <th
                      className={
                        roleType?.includes("Management") ? "p-2" : "d-none"
                      }
                    >
                      Price History
                    </th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(
                      (product) =>
                        !product.isDeleted &&
                        product.customer_prod_status !== "Archive"
                    )
                    .map((product) => (
                      <tr key={product.customer_prod_id}>
                        <td>
                          {/* Product Code */}
                          {product.prod_code}
                        </td>
                        <td>
                          {/* Product Name: show searchable dropdown for new items */}
                          {product.type === "new" ? (
                            <Select
                              options={getAvailableProducts(
                                product.customer_prod_id
                              ).map((prod) => ({
                                value: prod.product_id,
                                label: prod.product_name,
                                data: prod,
                              }))}
                              value={
                                product.prod_id
                                  ? {
                                      value: product.prod_id,
                                      label: product.prod_name,
                                    }
                                  : null
                              }
                              onChange={(selected) => {
                                if (selected) {
                                  const selectedProd = selected.data;
                                  updateProduct(product.customer_prod_id, {
                                    prod_id: selectedProd.product_id,
                                    prod_code: selectedProd.product_code,
                                    prod_name: selectedProd.product_name,
                                    prod_cat: selectedProd.product_category,
                                    prod_uom:
                                      selectedProd.prod_packaging
                                        ?.packaging_name || "",
                                  });
                                }
                              }}
                              placeholder="Search product"
                              isSearchable
                              menuPortalTarget={document.body}
                              styles={{
                                control: (provided) => ({
                                  ...provided,
                                  minHeight: "45px",
                                  height: "45px",
                                }),
                                placeholder: (provided) => ({
                                  ...provided,
                                  fontSize: "12px",
                                  color: "#888",
                                }),
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
                            />
                          ) : (
                            product.prod_name
                          )}
                        </td>
                        <td>{product.prod_cat}</td>
                        <td>
                          <select
                            className="form-select"
                            value={product.prod_id}
                            onChange={(e) => {
                              const selected = productData.find(
                                (p) => p.product_id == e.target.value
                              );
                              if (selected) {
                                updateProduct(product.customer_prod_id, {
                                  prod_id: selected.product_id,
                                  prod_code: selected.product_code,
                                  prod_name: selected.product_name,
                                  prod_cat: selected.product_category,
                                  prod_uom:
                                    selected.prod_packaging?.packaging_name ||
                                    "",
                                });
                              }
                            }}
                            disabled={product.type === "old"}
                          >
                            <option value="">Select Product</option>
                            {getAvailableProducts(product.customer_prod_id)
                              .length > 0 ? (
                              getAvailableProducts(
                                product.customer_prod_id
                              ).map((p) => (
                                <option key={p.product_id} value={p.product_id}>
                                  {p.product_name}
                                </option>
                              ))
                            ) : (
                              <option disabled value="">
                                {product.prod_id
                                  ? "Product selected"
                                  : "No available products"}
                              </option>
                            )}
                          </select>
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            value={product.customer_product_code || ""}
                            onChange={(e) =>
                              updateProduct(product.customer_prod_id, {
                                customer_product_code: e.target.value,
                              })
                            }
                            placeholder="Enter Code"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            value={product.customer_product_name || ""}
                            onChange={(e) =>
                              updateProduct(product.customer_prod_id, {
                                customer_product_name: e.target.value,
                              })
                            }
                            placeholder="Enter Name"
                          />
                        </td>
                        {roleType?.includes("Management") && (
                          <td>
                            <NumericFormat
                              className="form-control"
                              value={product.formatted_price || ""}
                              thousandSeparator={true}
                              fixedDecimalScale={true}
                              onValueChange={(values) => {
                                const { formattedValue, floatValue } = values;
                                updateProduct(product.customer_prod_id, {
                                  customer_prod_price: floatValue || 0,
                                  formatted_price: formattedValue,
                                });
                              }}
                              isAllowed={(values) => {
                                const { floatValue, formattedValue } = values;
                                // Check if the number has more than 5 decimal places
                                const hasMoreThan5Decimals =
                                  formattedValue.includes(".") &&
                                  formattedValue.split(".")[1].length > 5;

                                return (
                                  floatValue === undefined ||
                                  (floatValue >= 0 &&
                                    floatValue <= 9999999999 &&
                                    !hasMoreThan5Decimals)
                                );
                              }}
                              required
                            />
                            {/* <Form.Control
                              type="text"
                              value={product.formatted_price || ""}
                              onChange={(e) =>
                                handlePriceChange(
                                  product.customer_prod_id,
                                  e.target.value
                                )
                              }
                            /> */}
                          </td>
                        )}
                        <td
                          className={
                            roleType?.includes("Management")
                              ? "text-center"
                              : "d-none"
                          }
                        >
                          <span
                            className="border-0"
                            style={{ background: "inherit", cursor: "pointer" }}
                            title="Price History"
                            onClick={() =>
                              handleShowHistory(
                                product.prod_id,
                                product.prod_name,
                                product.prod_code,
                                product.formatted_price
                              )
                            }
                          >
                            <i className="fa-solid fa-clipboard-list fs-4 text-primary"></i>
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge bg-${
                              product.customer_prod_status === "Active"
                                ? "success"
                                : "danger"
                            }`}
                          >
                            {product.customer_prod_status}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`btn btn-outline-${
                              product.customer_prod_status === "Active"
                                ? "danger"
                                : "success"
                            }`}
                            onClick={() =>
                              removeProduct(
                                product.customer_prod_id,
                                product.customer_prod_status
                              )
                            }
                          >
                            <i
                              className={`fa-solid fa-${
                                product.customer_prod_status === "Active"
                                  ? "times"
                                  : "check"
                              }`}
                            ></i>
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="text-end mt-5">
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={addNewItem}
                  disabled={getAvailableProducts().length === 0}
                >
                  New Item
                </button>
                {getAvailableProducts().length === 0 && (
                  <div className="text-muted small mt-1">
                    All available products have been added
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContainer>
        </div>
      )}

      {/* Social Links and Contact Person sections */}
      <div className="row mt-4">
        <div className="col-sm">
          <div className="d-flex flex-row justify-content-between mb-1">
            <span>
              <Form.Label className="h5">Social Media Links</Form.Label>
            </span>
            <span className="mx-2">
              <button
                className="btn btn-primary"
                type="button"
                onClick={addSocialLink}
              >
                <i className="fa-solid fa-plus"></i> Add Links
              </button>
            </span>
          </div>

          <table className="table table-responsive table-hover">
            <thead className="table-light">
              <tr>
                <th>Platform</th>
                <th>Link</th>
                <th className="text-center" style={{ width: "10%" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {socialLinks.map(
                (link, index) =>
                  !link.isDeleted && (
                    <tr key={index}>
                      <td>
                        <Form.Control
                          type="text"
                          placeholder="Enter Social Media"
                          value={link.platform}
                          onChange={(e) =>
                            updateSocialLink(link, "platform", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          placeholder="Enter link"
                          value={link.link}
                          onChange={(e) =>
                            updateSocialLink(link, "link", e.target.value)
                          }
                        />
                      </td>
                      <td className="text-center" style={{ width: "10%" }}>
                        <button
                          className="btn"
                          type="button"
                          onClick={() => deleteSocialLink(index)}
                          disabled={
                            socialLinks.filter((link) => !link.isDeleted)
                              .length === 1
                          }
                        >
                          <i className="fa-solid fa-trash text-danger fs-5"></i>
                        </button>
                      </td>
                    </tr>
                  )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border my-5"></div>

      <div className="row">
        <div className="col-sm">
          <div className="d-flex flex-row justify-content-between align-items-center mb-4">
            <span>
              <Form.Label className="h5">CONTACT PERSON</Form.Label>
            </span>
            <span className="mx-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={addContact}
              >
                <i className="fa-solid fa-plus"></i> Add Contact
              </button>
            </span>
          </div>

          {contactPerson.map(
            (contact, index) =>
              !contact.isDeleted && (
                <div className="container-fluid border mb-3" key={index}>
                  <div className="d-flex flex-row justify-content-between mt-3 mb-4">
                    <span>
                      <Form.Label className="h6">
                        CONTACT {index + 1}
                      </Form.Label>
                    </span>
                    <span className="mx-2">
                      <button
                        className="btn"
                        type="button"
                        onClick={() => deleteContact(index)}
                        disabled={
                          contactPerson.filter((c) => !c.isDeleted).length === 1
                        }
                      >
                        <i className="fa-solid fa-trash text-danger fs-5"></i>
                      </button>
                    </span>
                  </div>
                  <div className="row mb-4">
                    <div className="col-sm">
                      <Form.Label>First Name :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="First Name"
                        value={contact.fname}
                        onChange={(e) =>
                          updateContact(contact, "fname", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-sm">
                      <Form.Label>Middle Name :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Middle Name"
                        value={contact.mname}
                        onChange={(e) =>
                          updateContact(contact, "mname", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-sm">
                      <Form.Label>Last Name :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Last Name"
                        value={contact.lname}
                        onChange={(e) =>
                          updateContact(contact, "lname", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="row mb-4">
                    <div className="col-sm">
                      <Form.Label>Email Address :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Email Address"
                        value={contact.email}
                        onChange={(e) =>
                          updateContact(contact, "email", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-sm">
                      <Form.Label>Job Position :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Job Position"
                        value={contact.jobPosition}
                        onChange={(e) =>
                          updateContact(contact, "jobPosition", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-sm">
                      <Form.Label>Mobile Number :</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Mobile Number"
                        value={contact.mobileNumber}
                        onChange={(e) =>
                          updateContact(contact, "mobileNumber", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="row mb-4">
                    <div className="col-sm">
                      <Form.Label>Remarks :</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={contact.Remarks}
                        onChange={(e) =>
                          updateContact(contact, "Remarks", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              )
          )}
        </div>
      </div>

      {/* price history Modal */}
      <Modal
        show={showHistoryModal}
        onHide={handleClose}
        backdrop="static"
        size="lg"
      >
        <Modal.Header className="border-0">
          <Modal.Title>Product Price History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="w-100 p-2">
            <div className="w-100 d-flex flex-row justify-content-between">
              <div className="d-flex flex-column">
                <span>
                  <strong>Product Name: </strong>
                  {selectedProduct?.productName || "N/A"}
                </span>
                <span>
                  <strong>Product Code: </strong>
                  {selectedProduct?.productCode || "N/A"}
                </span>
              </div>
              <span>
                <strong>Current Price: </strong>
                {selectedProduct?.currentPrice || "N/A"}
              </span>
            </div>

            <div className="mt-5">
              <div className="table-responsive data-table scrollable-contents">
                <table className="table table-hover table-responsive">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ backgroundColor: "#EBEFF4" }}>
                        <div className="text-center">Price</div>
                      </th>
                      <th style={{ backgroundColor: "#EBEFF4" }}>
                        <div className="text-center">Date Changed</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerPriceHistoryData.length > 0 ? (
                      customerPriceHistoryData.map((history, index) => (
                        <tr key={index}>
                          <td className="text-center">
                            {parseFloat(
                              history.previous_amount
                            ).toLocaleString()}
                          </td>
                          <td className="text-center">
                            {new Date(history.createdAt).toLocaleString(
                              "en-US",
                              {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                              }
                            )}
                            {" - "}
                            {new Date(history.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="text-center text-muted py-3">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <Modal.Footer className="border-0 p-0 mt-3">
            <Button variant="outline-secondary" onClick={handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal.Body>
      </Modal>
    </>
  );
};

CompanyForm.propTypes = {
  id: PropTypes.string,
  countryOptions: PropTypes.array.isRequired,
  setCompanyAddress: PropTypes.func.isRequired,
  companyAddress: PropTypes.string.isRequired,
  setCountry: PropTypes.func.isRequired,
  country: PropTypes.string.isRequired,
  setMobileNumber: PropTypes.func.isRequired,
  mobileNumber: PropTypes.string.isRequired,
  setTin: PropTypes.func.isRequired,
  tin: PropTypes.string,
  setCompanyName: PropTypes.func.isRequired,
  companyName: PropTypes.string.isRequired,
  setCompanyNature: PropTypes.func.isRequired,
  companyNature: PropTypes.string.isRequired,
  setCompanyEmail: PropTypes.func.isRequired,
  companyEmail: PropTypes.string.isRequired,
  socialLinks: PropTypes.array.isRequired,
  setSocialLinks: PropTypes.func.isRequired,
  contactPerson: PropTypes.array.isRequired,
  setContactPerson: PropTypes.func.isRequired,
  setTelephoneNumber: PropTypes.func.isRequired,
  telephoneNumber: PropTypes.string.isRequired,
  products: PropTypes.array,
  setProducts: PropTypes.func,
  roleType: PropTypes.array,
  currencyID: PropTypes.string,
  setCurrencyID: PropTypes.func.isRequired,
};

CompanyForm.defaultProps = {
  id: null,
  products: [],
  setProducts: () => {},
  roleType: [],
  tin: "",
  currencyID: "",
};

export default CompanyForm;
