import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NumericFormat } from "react-number-format";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import Select from "react-select";
import {
  CollapsibleContainer,
  useCollapsibleSections,
} from "../../../hooks/customHook/useCollapsibleSections";

const UpdateProduct = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const { id } = useParams();
  const [validated, setValidated] = useState(false);
  const [vendorData, setVendorData] = useState([]);
  const [packagingData, setPackagingData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  const { toggleSection, isOpen } = useCollapsibleSections();

  const { register, control, setValue, getValues, trigger } = useForm({
    defaultValues: {
      productCode: "",
      clientCode: "",
      productName: "",
      srpAmount: "",
      productCategory: "",
      packaging_id: "",
      source_id: "",
      remarks: "",
      productThreshold: "",
      items: [
        {
          companyName: "",
          vendorId: "",
          vendorEmail: "",
          vendorCountry: "",
          vendorPrice: 0,
          vendorProductCode: "",
          vendorProductName: "",
          vendorName: "",
        },
      ],
      items2: [
        {
          companyName: "",
          companyId: "",
          companyEmail: "",
          companyNature: "",
          companyPrice: 0,
          companyProductCode: "",
          companyProductName: "",
        },
      ],
    },
  });

  const {
    fields: vendortable,
    append: appendVendor,
    remove: removeVendor,
  } = useFieldArray({
    control,
    name: "items",
  });

  const {
    fields: customertable,
    append: appendCustomer,
    remove: removeCustomer,
  } = useFieldArray({
    control,
    name: "items2",
  });

  const itemsValues = useWatch({
    control,
    name: "items",
    defaultValue: [],
  });

  const items2Values = useWatch({
    control,
    name: "items2",
    defaultValue: [],
  });

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const fetchVendorData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/getVendors`);
      return res.data;
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return [];
    }
  };

  const fetchCustomerData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/getCustomers`);
      return res.data;
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  };

  const fetchPackging = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/fetchDataPackaging`);
      return res.data;
    } catch (error) {
      console.error("Error fetching packaging:", error);
      return [];
    }
  };

  const fetchSource = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/fetchDataSource`);
      return res.data;
    } catch (error) {
      console.error("Error fetching sources:", error);
      return [];
    }
  };

  // Check if vendor is selected for a specific row
  const isVendorSelected = (index) => {
    const vendorId = getValues(`items.${index}.vendorId`);
    return !!vendorId && vendorId.trim() !== "";
  };

  // Check if customer is selected for a specific row
  const isCustomerSelected = (index) => {
    const companyId = getValues(`items2.${index}.companyId`);
    return !!companyId && companyId.trim() !== "";
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Load all base data first
        const [vendors, packaging, sources, customers] = await Promise.all([
          fetchVendorData(),
          fetchPackging(),
          fetchSource(),
          fetchCustomerData(),
        ]);

        // Set all the data at once
        setVendorData(vendors);
        setPackagingData(packaging);
        setSourceData(sources);
        setCustomerData(customers);

        // Then load product-specific data
        const productRes = await axios.get(
          `${BASE_URL}/product/fetchProductEdit`,
          { params: { id } },
        );
        if (productRes.data) {
          const productData = productRes.data[0];
          setValue("productCode", productData.product_code);
          setValue("productName", productData.product_name);
          setValue("productCategory", productData.product_category);
          setValue("clientCode", productData.client_code);
          setValue("packaging_id", productData.packaging_id);
          setValue("source_id", productData.source_id);
          setValue("remarks", productData.description);
          setValue("productThreshold", productData.threshold);
          setValue("srpAmount", productData.srp_amount);
        }

        // Load vendor associations
        const vendorRes = await axios.get(
          `${BASE_URL}/productTagVendor/fetchProductVendor`,
          { params: { id } },
        );
        if (vendorRes.data) {
          setValue("items", []);
          const vendorIds = vendorRes.data.map((vendor) => vendor.vendor.id);
          setSelectedVendors(vendorIds);

          vendorRes.data.forEach((vendor) => {
            appendVendor({
              companyName: vendor.vendor.company_name,
              vendorId: vendor.vendor.id,
              vendorProductCode: vendor.vendor_product_code,
              vendorProductName: vendor.vendor_product_name,
              vendorName: `${vendor.vendor.fname} ${vendor.vendor.lname}`,
              vendorEmail: vendor.vendor.company_email,
              vendorCountry: vendor.vendor.company_country,
              vendorPrevPrice: vendor.previous_price,
              vendorPrice: vendor.product_price,
            });
          });
        }

        // Load customer associations
        const customerRes = await axios.get(
          `${BASE_URL}/productTagVendor/fetchProductCustomer`,
          { params: { id } },
        );
        if (customerRes.data) {
          setValue("items2", []);
          const customerIds = customerRes.data.map(
            (customer) => customer.ptc_customer_id.customer_id,
          );
          setSelectedCustomers(customerIds);

          customerRes.data.forEach((customer) => {
            const fullCustomer =
              customers.find(
                (c) => c.customer_id === customer.ptc_customer_id.customer_id,
              ) || customer.ptc_customer_id;

            appendCustomer({
              companyName: fullCustomer.company_name,
              companyId: fullCustomer.customer_id,
              companyProductCode: customer.customer_product_code,
              companyProductName: customer.customer_product_name,
              companyNature: fullCustomer.company_nature,
              companyEmail: fullCustomer.company_email,
              companyPrevPrice: customer.previous_price,
              companyPrice: customer.product_price,
            });
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading product data:", error);
        setIsLoading(false);
        swal({
          title: "Error",
          text: "Failed to load product data. Please try again.",
          icon: "error",
          button: "OK",
        });
      }
    };

    fetchAllData();
  }, [id, setValue, appendVendor, appendCustomer]);

  const addNewItem = () => {
    appendVendor({
      companyName: "",
      vendorId: "",
      vendorEmail: "",
      vendorCountry: "",
      vendorPrice: 0,
      vendorProductCode: "",
      vendorProductName: "",
      vendorName: "",
    });
    setSelectedVendors((prev) => [...prev, ""]);
  };

  const addNewItem2 = () => {
    appendCustomer({
      companyName: "",
      companyId: "",
      companyEmail: "",
      companyNature: "",
      companyPrice: 0,
      companyProductCode: "",
      companyProductName: "",
    });
    setSelectedCustomers((prev) => [...prev, ""]);
  };

  const formatNumber = (value) => {
    if (!value) return "";

    let inputValue = value.replace(/[^0-9.]/g, "");
    let [integerPart, decimalPart] = inputValue.split(".");

    integerPart = integerPart.replace(/^0+/, "") || "0";
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (decimalPart !== undefined) {
      decimalPart = decimalPart.slice(0, 7);
      return `${integerPart}.${decimalPart}`;
    }

    return integerPart;
  };

  const update = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the required fields.",
      });
      return;
    }

    const confirmed = await swal({
      title: "Update this product?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (confirmed) {
      try {
        const formData = getValues();

        const formattedFormData = {
          ...formData,
          productThreshold:
            parseFloat(String(formData.productThreshold).replace(/,/g, "")) ||
            0,
          srpAmount:
            parseFloat(String(formData.srpAmount).replace(/,/g, "")) || 0,
          items: formData.items.map((item) => ({
            ...item,
            vendorPrice:
              parseFloat(String(item.vendorPrice).replace(/,/g, "")) || 0,
            vendorProductCode: item.vendorProductCode || "",
            vendorProductName: item.vendorProductName || "",
          })),
          items2: formData.items2.map((item) => ({
            ...item,
            companyPrice:
              parseFloat(String(item.companyPrice).replace(/,/g, "")) || 0,
            companyProductCode: item.companyProductCode || "",
            companyProductName: item.companyProductName || "",
          })),
          userLoggedID,
        };

        const res = await axios.put(`${BASE_URL}/product/updateProduct`, {
          id: id,
          ...formattedFormData,
          userLoggedID,
        });

        if (res.status === 200) {
          await swal({
            title: "Success",
            text: "Product updated successfully",
            icon: "success",
            buttons: false,
            timer: 2000,
          });
          navigate("/inventory/product-list");
          window.scrollTo(0, 0);
        }
      } catch (error) {
        if (error.response?.status === 409) {
          swal({
            icon: "error",
            title: error.response.data.message,
            text: "Please choose a unique name for the product to proceed.",
            button: "OK",
          });
        } else {
          swal({
            title: "Error",
            text: "Failed to update product. Please try again.",
            icon: "error",
            button: "OK",
          });
        }
      }
    }

    setValidated(true);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading product data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-100 w-100 border bg-white custom-container">
        {authrztn.includes("ProductList-Edit") ? (
          <>
            <Form noValidate validated={validated} onSubmit={update}>
              <div className="w-100 p-2 d-flex flex-row justify-content-between">
                <div className="d-flex flex-column title-custom">
                  <span className="fs-3">
                    <Link
                      to="/inventory/product-list"
                      className="text-dark me-2"
                    >
                      <i className="fa-solid fa-arrow-left"></i>
                    </Link>
                    UPDATE PRODUCT
                  </span>
                </div>
              </div>

              <div className="p-2">
                <span className="text-decoration-underline">
                  GENERAL INFORMATION
                </span>
                <div className="row mb-3 mt-3">
                  <div className="col-md">
                    <Form.Label htmlFor="productCode">Product Code</Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      id="productCode"
                      {...register("productCode")}
                      readOnly
                    />
                  </div>

                  <div className="col-md">
                    <Form.Label htmlFor="productName">
                      Product Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      placeholder="Enter Product Name"
                      id="productName"
                      {...register("productName", { required: true })}
                    />
                  </div>

                  <div className="col-md">
                    <Form.Label htmlFor="srpAmount">SRP</Form.Label>
                    <input
                      type="text"
                      id="srpAmount"
                      {...register("srpAmount", {
                        onChange: (e) => {
                          let value = e.target.value;
                          value = value.replace(/[^0-9.]/g, "");
                          const decimalParts = value.split(".");
                          if (decimalParts.length > 2) {
                            value =
                              decimalParts[0] +
                              "." +
                              decimalParts.slice(1).join("");
                          }
                          if (decimalParts.length > 1) {
                            value =
                              decimalParts[0] +
                              "." +
                              decimalParts[1].slice(0, 2);
                          }
                          const parts = value.split(".");
                          parts[0] = parts[0].replace(
                            /\B(?=(\d{3})+(?!\d))/g,
                            ",",
                          );
                          const formattedValue = parts.join(".");
                          setValue("srpAmount", formattedValue);
                        },
                        pattern: {
                          value: /^[0-9]+(\.[0-9]{1,7})?$/,
                          message: "",
                        },
                      })}
                      className="form-control p-3"
                      placeholder="Enter SRP (e.g. 1,000.00)"
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md">
                    <Form.Label htmlFor="productCategory">
                      Product Category <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      className="p-3"
                      id="productCategory"
                      {...register("productCategory", { required: true })}
                    >
                      <option disabled value="">
                        Select Category
                      </option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Consumables">Consumables</option>
                    </Form.Select>
                  </div>

                  <div className="col-md">
                    <Form.Label htmlFor="packaging_id">
                      Unit of Measure <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      className="form-select p-3"
                      id="packaging_id"
                      {...register("packaging_id", { required: true })}
                    >
                      <option disabled value="">
                        Select Unit
                      </option>
                      {packagingData.map((data) => (
                        <option key={data.id} value={data.id}>
                          {data.packaging_name} - ({data.unit_quantity}
                          {data.unit})
                        </option>
                      ))}
                    </Form.Select>
                  </div>

                  <div className="col-md">
                    <Form.Label htmlFor="remarks">Remarks</Form.Label>
                    <Form.Control
                      id="remarks"
                      as="textarea"
                      rows={3}
                      style={{
                        fontSize: "16px",
                        height: "200px",
                        maxHeight: "200px",
                        resize: "none",
                        overflowY: "auto",
                      }}
                      placeholder="Enter Remarks"
                      {...register("remarks")}
                    />
                  </div>
                </div>

                <span className="text-decoration-underline">
                  THRESHOLD NOTIFICATION
                </span>
                <div className="row mb-3 mt-3">
                  <div className="col-md-6">
                    <Form.Label htmlFor="productThreshold">
                      Critical Inventory Threshold
                    </Form.Label>
                    <div className="input-group">
                      <span className="input-group-text p-3">No.</span>
                      <Form.Control
                        type="text"
                        className="p-3"
                        id="productThreshold"
                        placeholder="Input quantity"
                        {...register("productThreshold", {
                          onChange: (e) => {
                            const formattedValue = formatNumber(e.target.value);
                            setValue("productThreshold", formattedValue);
                          },
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <CollapsibleContainer
                title="Vendor Lists"
                toggleSection={toggleSection}
                isOpen={isOpen}
              >
                <div
                  className="row mx-auto scrollable-contents"
                  style={{
                    maxHeight: isOpen ? "1000px" : "0px",
                    overflowX: "hidden",
                    overflowY: "auto",
                    transition:
                      "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="container-fluid">
                    <div className="row">
                      <div className="col-sm">
                        <div className="table-responsive">
                          <table
                            className="table table-bordered table-hover"
                            id="createProductTable"
                          >
                            <thead className="table-light">
                              <tr>
                                <th className="p-2">Vendor</th>
                                <th className="p-2">Contact Person</th>
                                <th className="p-2">Client Code</th>
                                <th className="p-2">Client Product Name</th>
                                <th className="p-2">Price</th>
                                <th className="p-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {vendortable.map((item, index) => (
                                <tr key={`vendor-${index}-${item.vendorId}`}>
                                  <td style={{ position: "relative" }}>
                                    <Select
                                      required={isVendorSelected(index)}
                                      options={vendorData
                                        .filter(
                                          (vendor) =>
                                            !selectedVendors.includes(
                                              vendor.id,
                                            ) ||
                                            getValues(
                                              `items.${index}.vendorId`,
                                            ) === vendor.id,
                                        )
                                        .map((vendor) => ({
                                          value: vendor.id,
                                          label: vendor.company_name,
                                          data: vendor,
                                        }))}
                                      value={
                                        vendorData.find(
                                          (v) =>
                                            v.id ===
                                            getValues(
                                              `items.${index}.vendorId`,
                                            ),
                                        )
                                          ? {
                                              value: getValues(
                                                `items.${index}.vendorId`,
                                              ),
                                              label: vendorData.find(
                                                (v) =>
                                                  v.id ===
                                                  getValues(
                                                    `items.${index}.vendorId`,
                                                  ),
                                              )?.company_name,
                                            }
                                          : null
                                      }
                                      onChange={(selectedOption) => {
                                        if (selectedOption) {
                                          const selectedVendor =
                                            selectedOption.data;
                                          setValue(
                                            `items.${index}.vendorId`,
                                            selectedVendor.id,
                                          );
                                          setValue(
                                            `items.${index}.companyName`,
                                            selectedVendor.company_name,
                                          );
                                          setValue(
                                            `items.${index}.vendorName`,
                                            `${selectedVendor.fname} ${selectedVendor.lname}`,
                                          );
                                          setValue(
                                            `items.${index}.vendorEmail`,
                                            selectedVendor.company_email,
                                          );
                                          setValue(
                                            `items.${index}.vendorCountry`,
                                            selectedVendor.company_country,
                                          );

                                          setSelectedVendors((prev) => {
                                            const updated = [...prev];
                                            updated[index] = selectedVendor.id;
                                            return updated;
                                          });
                                        } else {
                                          // Clear the selection and related fields
                                          setValue(
                                            `items.${index}.vendorId`,
                                            "",
                                          );
                                          setValue(
                                            `items.${index}.companyName`,
                                            "",
                                          );
                                          setValue(
                                            `items.${index}.vendorName`,
                                            "",
                                          );
                                          setValue(
                                            `items.${index}.vendorEmail`,
                                            "",
                                          );
                                          setValue(
                                            `items.${index}.vendorCountry`,
                                            "",
                                          );
                                          setValue(
                                            `items.${index}.vendorPrice`,
                                            "",
                                          );
                                          setValue(
                                            `items.${index}.vendorProductCode`,
                                            "",
                                          );
                                          setValue(
                                            `items.${index}.vendorProductName`,
                                            "",
                                          );
                                        }
                                      }}
                                      placeholder="Select Vendor"
                                      isSearchable
                                      isClearable
                                      styles={{
                                        control: (provided) => ({
                                          ...provided,
                                          minHeight: "38px",
                                          height: "38px",
                                        }),
                                        menu: (provided) => ({
                                          ...provided,
                                          position: "absolute",
                                          zIndex: 9999,
                                          width: "auto",
                                          minWidth: "100%",
                                        }),
                                        option: (provided) => ({
                                          ...provided,
                                          padding: "8px 12px",
                                        }),
                                      }}
                                      menuPortalTarget={document.body}
                                      menuPosition="fixed"
                                      menuShouldBlockScroll={true}
                                      autoFocus={false}
                                      menuShouldScrollIntoView={false}
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      {...register(`items.${index}.vendorName`)}
                                      className="p-2"
                                      readOnly
                                      autoComplete="off"
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      {...register(
                                        `items.${index}.vendorProductCode`,
                                      )}
                                      className="p-2"
                                      placeholder="Enter Code"
                                      disabled={!isVendorSelected(index)}
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      {...register(
                                        `items.${index}.vendorProductName`,
                                      )}
                                      className="p-2"
                                      placeholder="Enter Name"
                                      disabled={!isVendorSelected(index)}
                                    />
                                  </td>
                                  <td>
                                    <NumericFormat
                                      className="form-control p-2"
                                      required={isVendorSelected(index)}
                                      name={`items.${index}.vendorPrice`}
                                      value={getValues(
                                        `items.${index}.vendorPrice`,
                                      )}
                                      thousandSeparator={true}
                                      onValueChange={(values) => {
                                        const rawValue = values.floatValue || 0;
                                        const formattedValue =
                                          values.formattedValue;
                                        setValue(
                                          `items.${index}.vendorPrice`,
                                          formattedValue,
                                          {
                                            shouldValidate: true,
                                          },
                                        );
                                      }}
                                      isAllowed={(values) => {
                                        const { floatValue, formattedValue } =
                                          values;
                                        const hasMoreThan5Decimals =
                                          formattedValue.includes(".") &&
                                          formattedValue.split(".")[1].length >
                                            5;

                                        return (
                                          floatValue === undefined ||
                                          (floatValue >= 0 &&
                                            floatValue <= 9999999999 &&
                                            !hasMoreThan5Decimals)
                                        );
                                      }}
                                      placeholder="0"
                                      onBlur={() => {
                                        trigger(`items.${index}.vendorPrice`);
                                      }}
                                      disabled={!isVendorSelected(index)}
                                    />
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => {
                                        if (vendortable.length > 1) {
                                          removeVendor(index);
                                          setSelectedVendors((prev) =>
                                            prev.filter((_, i) => i !== index),
                                          );
                                        } else {
                                          swal({
                                            title: "Oops!",
                                            text: "Cannot delete the last item",
                                            icon: "warning",
                                            buttons: false,
                                            timer: 2000,
                                            dangerMode: true,
                                          });
                                        }
                                      }}
                                      disabled={vendortable.length === 1}
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
                            onClick={addNewItem}
                          >
                            New Item
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContainer>

              <CollapsibleContainer
                title="Customer Lists"
                toggleSection={toggleSection}
                isOpen={isOpen}
              >
                <div
                  className="row mx-auto scrollable-contents"
                  style={{
                    maxHeight: isOpen ? "1000px" : "0px",
                    overflowX: "hidden",
                    overflowY: "auto",
                    transition:
                      "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="container-fluid">
                    <div className="row">
                      <div className="col-sm">
                        <div className="table-responsive">
                          <table
                            className="table table-bordered table-hover"
                            id="createProductTable"
                          >
                            <thead className="table-light">
                              <tr>
                                <th className="p-2">Customer</th>
                                <th className="p-2">Company Nature</th>
                                <th className="p-2">Client Code</th>
                                <th className="p-2">Client Product Name</th>
                                <th className="p-2">Price</th>
                                <th className="p-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {customertable.map((item, index) => (
                                <tr key={`customer-${index}-${item.companyId}`}>
                                  <td style={{ position: "relative" }}>
                                    <Select
                                      required={isCustomerSelected(index)}
                                      options={customerData
                                        .filter(
                                          (customer) =>
                                            !selectedCustomers.includes(
                                              customer.customer_id,
                                            ) ||
                                            getValues(
                                              `items2.${index}.companyId`,
                                            ) === customer.customer_id,
                                        )
                                        .map((customer) => ({
                                          value: customer.customer_id,
                                          label: customer.company_name,
                                          data: customer,
                                        }))}
                                      value={
                                        customerData.find(
                                          (v) =>
                                            v.customer_id ===
                                            getValues(
                                              `items2.${index}.companyId`,
                                            ),
                                        )
                                          ? {
                                              value: getValues(
                                                `items2.${index}.companyId`,
                                              ),
                                              label: customerData.find(
                                                (v) =>
                                                  v.customer_id ===
                                                  getValues(
                                                    `items2.${index}.companyId`,
                                                  ),
                                              )?.company_name,
                                            }
                                          : null
                                      }
                                      onChange={(selectedOption) => {
                                        if (selectedOption) {
                                          const selectedCustomer =
                                            selectedOption.data;
                                          setValue(
                                            `items2.${index}.companyId`,
                                            selectedCustomer.customer_id,
                                          );
                                          setValue(
                                            `items2.${index}.companyName`,
                                            selectedCustomer.company_name,
                                          );
                                          setValue(
                                            `items2.${index}.companyEmail`,
                                            selectedCustomer.company_email,
                                          );
                                          setValue(
                                            `items2.${index}.companyNature`,
                                            selectedCustomer.company_nature,
                                          );

                                          setSelectedCustomers((prev) => {
                                            const updated = [...prev];
                                            updated[index] =
                                              selectedCustomer.customer_id;
                                            return updated;
                                          });
                                        } else {
                                          // Clear the selection and related fields
                                          setValue(
                                            `items2.${index}.companyId`,
                                            "",
                                          );
                                          setValue(
                                            `items2.${index}.companyName`,
                                            "",
                                          );
                                          setValue(
                                            `items2.${index}.companyEmail`,
                                            "",
                                          );
                                          setValue(
                                            `items2.${index}.companyNature`,
                                            "",
                                          );
                                          setValue(
                                            `items2.${index}.companyPrice`,
                                            "",
                                          );
                                          setValue(
                                            `items2.${index}.companyProductCode`,
                                            "",
                                          );
                                          setValue(
                                            `items2.${index}.companyProductName`,
                                            "",
                                          );
                                        }
                                      }}
                                      placeholder="Select Customer"
                                      isSearchable
                                      isClearable
                                      styles={{
                                        control: (provided) => ({
                                          ...provided,
                                          minHeight: "38px",
                                          height: "38px",
                                        }),
                                        menu: (provided) => ({
                                          ...provided,
                                          position: "absolute",
                                          zIndex: 9999,
                                          width: "auto",
                                          minWidth: "100%",
                                        }),
                                        option: (provided) => ({
                                          ...provided,
                                          padding: "8px 12px",
                                        }),
                                      }}
                                      menuPortalTarget={document.body}
                                      menuPosition="fixed"
                                      menuShouldBlockScroll={true}
                                      autoFocus={false}
                                      menuShouldScrollIntoView={false}
                                    />
                                  </td>

                                  <td>
                                    <Form.Control
                                      {...register(
                                        `items2.${index}.companyNature`,
                                      )}
                                      className="p-2"
                                      readOnly
                                      autoComplete="off"
                                    />
                                  </td>

                                  <td>
                                    <Form.Control
                                      type="text"
                                      {...register(
                                        `items2.${index}.companyProductCode`,
                                      )}
                                      className="p-2"
                                      placeholder="Enter Code"
                                      disabled={!isCustomerSelected(index)}
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      type="text"
                                      {...register(
                                        `items2.${index}.companyProductName`,
                                      )}
                                      className="p-2"
                                      placeholder="Enter Name"
                                      disabled={!isCustomerSelected(index)}
                                    />
                                  </td>
                                  <td>
                                    <NumericFormat
                                      className="form-control p-2"
                                      required={isCustomerSelected(index)}
                                      name={`items2.${index}.companyPrice`}
                                      value={getValues(
                                        `items2.${index}.companyPrice`,
                                      )}
                                      thousandSeparator={true}
                                      onValueChange={(values) => {
                                        const rawValue = values.floatValue || 0;
                                        const formattedValue =
                                          values.formattedValue;
                                        setValue(
                                          `items2.${index}.companyPrice`,
                                          formattedValue,
                                          {
                                            shouldValidate: true,
                                          },
                                        );
                                      }}
                                      isAllowed={(values) => {
                                        const { floatValue, formattedValue } =
                                          values;
                                        const hasMoreThan5Decimals =
                                          formattedValue.includes(".") &&
                                          formattedValue.split(".")[1].length >
                                            5;

                                        return (
                                          floatValue === undefined ||
                                          (floatValue >= 0 &&
                                            floatValue <= 9999999999 &&
                                            !hasMoreThan5Decimals)
                                        );
                                      }}
                                      placeholder="0"
                                      onBlur={() => {
                                        trigger(`items2.${index}.companyPrice`);
                                      }}
                                      disabled={!isCustomerSelected(index)}
                                    />
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => {
                                        if (customertable.length > 1) {
                                          removeCustomer(index);
                                          setSelectedCustomers((prev) =>
                                            prev.filter((_, i) => i !== index),
                                          );
                                        } else {
                                          swal({
                                            title: "Oops!",
                                            text: "Cannot delete the last item",
                                            icon: "warning",
                                            buttons: false,
                                            timer: 2000,
                                            dangerMode: true,
                                          });
                                        }
                                      }}
                                      disabled={customertable.length === 1}
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
                            onClick={addNewItem2}
                          >
                            New Item
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContainer>

              <div className="w-100 mb-3 d-flex flex-row align-items-end justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary title-button mx-3"
                  onClick={() => {
                    navigate("/inventory/product-list");
                    window.scrollTo(0, 0);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary title-button">
                  Save
                </button>
              </div>
            </Form>
          </>
        ) : (
          <div className="no-access">
            <img src={NoAccess} alt="NoAccess" className="no-access-img" />
            <h3>You don't have access to this function.</h3>
          </div>
        )}
      </div>
    </>
  );
};

export default UpdateProduct;
