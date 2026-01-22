import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { Form } from "react-bootstrap";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ThreeDot } from "react-loading-indicators";
import { Link, useNavigate } from "react-router-dom";
import swal from "sweetalert";
import BASE_URL from "../../../assets/global/url";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import Select from "react-select";
import {
  CollapsibleContainer,
  useCollapsibleSections,
} from "../../../hooks/customHook/useCollapsibleSections";

const CreateProduct = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const debounceTimeout = useRef(null);
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [vendorData, setVendorData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [isProductExisting, setIsProductExisting] = useState(false);
  const [packagingData, setPackagingData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // Track which vendor/customer fields are selected
  const [vendorSelections, setVendorSelections] = useState({});
  const [customerSelections, setCustomerSelections] = useState({});

  // for collapsable
  const { toggleSection, isOpen } = useCollapsibleSections();

  const checkProductCode = async (e, productCode) => {
    clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${BASE_URL}/product/fetchProductCode`, {
          params: { id: productCode },
        });

        if (res.data.success && res.data.data) {
          console.log("Product exists:", res.data.data);

          const confirmed = await swal({
            icon: "warning",
            title: "Oops!",
            text: `Product Code already exists.`,
            button: "OK",
            dangerMode: true,
            closeOnClickOutside: false,
            closeOnEsc: false,
          });

          if (confirmed) {
            e.target.value = "";
          }
        }
      } catch (err) {
        console.error("Error checking product:", err);
      }
    }, 500);
  };

  const checkClientCode = async (e, clientCode) => {
    clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${BASE_URL}/product/fetchClientCode`, {
          params: { id: clientCode },
        });

        if (res.data.success && res.data.data) {
          console.log("Client exists:", res.data.data);

          const confirmed = await swal({
            icon: "warning",
            title: "Oops!",
            text: `Client Code already exists.`,
            button: "OK",
            dangerMode: true,
            closeOnClickOutside: false,
            closeOnEsc: false,
          });

          if (confirmed) {
            e.target.value = "";
          }
        }
      } catch (err) {
        console.error("Error checking product:", err);
      }
    }, 500);
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const reloadProductCode = () => {
    axios
      .get(BASE_URL + "/product/lastCode")
      .then((res) => {
        const codes =
          res.data !== null ? res.data.toString().padStart(6, "0") : "000001";
        // setValue("productCode", codes);
        setIsLoading(false);
      })
      .catch((err) => console.log(err));
  };

  const fetchVendorData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/getVendors`);
      setVendorData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCustomerData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/getCustomers`);
      setCustomerData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPackging = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/fetchDataPackaging`);
      setPackagingData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSource = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/fetchDataSource`);
      setSourceData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadProductCode();
      fetchVendorData();
      fetchCustomerData();
      fetchPackging();
      fetchSource();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const { register, control, setValue, getValues } = useForm({
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
          vendoryCountry: "",
          vendorPrice: 0,
          vendorProductCode: "",
          vendorProductName: "",
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

  const addNewItem = () => {
    appendVendor({
      companyName: "",
      vendorId: "",
      vendorEmail: "",
      vendoryCountry: "",
      vendorPrice: 0,
      vendorProductCode: "",
      vendorProductName: "",
    });
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
  };

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

  // Check if vendor is selected for a specific row based on actual data
  const isVendorSelected = (index) => {
    const vendorId = getValues(`items.${index}.vendorId`);
    return !!vendorId && vendorId.trim() !== "";
  };

  // Check if customer is selected for a specific row based on actual data
  const isCustomerSelected = (index) => {
    const companyId = getValues(`items2.${index}.companyId`);
    return !!companyId && companyId.trim() !== "";
  };

  // Update vendor selections based on form data changes
  useEffect(() => {
    const newVendorSelections = {};
    vendortable.forEach((_, index) => {
      const vendorId = getValues(`items.${index}.vendorId`);
      newVendorSelections[index] = !!vendorId && vendorId.trim() !== "";
    });
    setVendorSelections(newVendorSelections);
  }, [vendortable, getValues]);

  // Update customer selections based on form data changes
  useEffect(() => {
    const newCustomerSelections = {};
    customertable.forEach((_, index) => {
      const companyId = getValues(`items2.${index}.companyId`);
      newCustomerSelections[index] = !!companyId && companyId.trim() !== "";
    });
    setCustomerSelections(newCustomerSelections);
  }, [customertable, getValues]);

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      swal({
        title: "Create this new product?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const formData = getValues();

          const formattedFormData = {
            ...formData,
            srpAmount:
              formData.srpAmount && formData.srpAmount.trim() !== ""
                ? parseFloat(String(formData.srpAmount).replace(/,/g, "")) || 0
                : 0,
            productThreshold: parseFloat(
              String(formData.productThreshold).replace(/,/g, ""),
            ),
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

          axios
            .post(`${BASE_URL}/product/createProduct`, formattedFormData, {
              headers: { "Content-Type": "application/json" },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Product created successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                }).then(() => {
                  navigate("/inventory/product-list");
                });
              }
            })
            .catch((error) => {
              if (error.response) {
                if (error.response.status === 401) {
                  swal({
                    title: "Duplicate Product Code!",
                    text: "Product code already exists. Try another.",
                    icon: "warning",
                  });
                } else if (error.response.status === 409) {
                  swal({
                    title: "Duplicate Product Name!",
                    text: "Product name already exists. Try another.",
                    icon: "warning",
                  });
                } else {
                  swal({
                    title: "Something Went Wrong",
                    text: "Please contact your support immediately",
                    icon: "error",
                    buttons: false,
                    timer: 2000,
                    dangerMode: true,
                  });
                }
              } else {
                swal({
                  title: "Network Error",
                  text: "Unable to connect to the server.",
                  icon: "error",
                });
              }
            });
        }
      });
    }

    setValidated(true);
  };

  //Function for formatting the number using userForm
  const formatNumber = (value) => {
    if (!value) return "";

    // Remove all non-numeric characters except decimal point
    let inputValue = value.replace(/[^0-9.]/g, "");

    // Split into integer and decimal parts
    let [integerPart, decimalPart] = inputValue.split(".");

    // Remove leading zeros from integer part
    integerPart = integerPart.replace(/^0+/, "") || "0";

    // Add commas for thousands separator
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Handle decimal part (limit to 2 digits)
    if (decimalPart !== undefined) {
      decimalPart = decimalPart.slice(0, 7); // Keep only first 2 digits
      return `${integerPart}.${decimalPart}`;
    }

    return integerPart;
  };

  return (
    <>
      <div className="h-100 w-100 border bg-white custom-container">
        {isLoading ? (
          <div className="loading-container">
            <ThreeDot
              variant="brick-stack"
              color="#6290FE"
              size="large"
              text="Loading Data..."
              textColor=""
            />
          </div>
        ) : authrztn.includes("ProductList-Add") ? (
          <>
            <Form noValidate validated={validated} onSubmit={add}>
              <div className="w-100 p-2 d-flex flex-row justify-content-between">
                <div className="d-flex flex-column title-custom">
                  <span className="fs-3">
                    <Link
                      to="/inventory/product-list"
                      className="text-dark me-2"
                    >
                      <i class="fa-solid fa-arrow-left"></i>
                    </Link>
                    CREATE PRODUCT
                  </span>
                </div>
              </div>

              <div className="p-2">
                <span className="text-decoration-underline">
                  GENERAL INFORMATION
                </span>
                <div className="row mb-3 mt-3">
                  <div className="col-md">
                    <Form.Label htmlFor="productCode">
                      Product Code <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      id="productCode"
                      {...register("productCode", {
                        onChange: (e) => checkProductCode(e, e.target.value),
                      })}
                      required
                      placeholder="Enter Code"
                    />
                  </div>

                  <div className="col-md">
                    <Form.Label htmlFor="productName">
                      Product Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      placeholder="Enter Name"
                      id="productName"
                      {...register("productName")}
                      required
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

                          // Remove all non-digit and non-dot characters
                          value = value.replace(/[^0-9.]/g, "");

                          // Ensure only one decimal point
                          const decimalParts = value.split(".");
                          if (decimalParts.length > 2) {
                            value =
                              decimalParts[0] +
                              "." +
                              decimalParts.slice(1).join("");
                          }

                          // Limit to 7 decimal places
                          if (decimalParts.length > 1) {
                            value =
                              decimalParts[0] +
                              "." +
                              decimalParts[1].slice(0, 2);
                          }

                          // Format with commas
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
                      {...register("productCategory")}
                      required
                    >
                      <option disabled value="">
                        Select Category
                      </option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Consumables">Consumables</option>
                      <option value="Maintenance">Maintenance</option>
                    </Form.Select>
                  </div>
                  <div className="col-md">
                    <Form.Label htmlFor="packaging_id">
                      Unit of Measure <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      className="form-select p-3"
                      id="packaging_id"
                      {...register("packaging_id")}
                      required
                    >
                      <option disabled value="">
                        Select Unit of Measure
                      </option>
                      {packagingData.map((data, index) => (
                        <option key={index} value={data.id}>
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
                      <Form.Control
                        type="text"
                        className="p-3"
                        id="productThreshold"
                        placeholder="Input quantity"
                        {...register(`productThreshold`, {
                          onChange: (e) => {
                            const formattedValue = formatNumber(e.target.value);
                            setValue(`productThreshold`, formattedValue);
                          },
                        })}
                      />
                      <span className="input-group-text p-3">Kilogram(s).</span>
                    </div>
                  </div>

                  <div className="col-md-6"></div>
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
                                <tr key={item.id}>
                                  <td style={{ position: "relative" }}>
                                    <Select
                                      required={
                                        !!getValues(`items.${index}.vendorId`)
                                      }
                                      options={
                                        vendortable.length === 1
                                          ? vendorData.map((vendor) => ({
                                              value: vendor.id,
                                              label: vendor.company_name,
                                              data: vendor,
                                            }))
                                          : vendorData
                                              .filter(
                                                (data) =>
                                                  !selectedVendors.includes(
                                                    data.id,
                                                  ) ||
                                                  selectedVendors[index] ===
                                                    data.id,
                                              )
                                              .map((vendor) => ({
                                                value: vendor.id,
                                                label: vendor.company_name,
                                                data: vendor,
                                              }))
                                      }
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
                                          // Clear the selection
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

                                          // Clear the price, client code, and client product name
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
                                        menuPortal: (provided) => ({
                                          ...provided,
                                          zIndex: 9999,
                                        }),
                                        option: (provided) => ({
                                          ...provided,
                                          padding: "8px 12px",
                                        }),
                                      }}
                                      menuPortalTarget={document.body}
                                      menuPosition="fixed"
                                      menuShouldBlockScroll={true}
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      {...register(`items.${index}.vendorName`)}
                                      className="p-2"
                                      readOnly
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
                                    <Form.Control
                                      type="text"
                                      required={isVendorSelected(index)}
                                      {...register(
                                        `items.${index}.vendorPrice`,
                                        {
                                          onChange: (e) => {
                                            const rawValue =
                                              e.target.value.replace(/,/g, "");
                                            const formattedValue =
                                              formatNumber(rawValue);
                                            setValue(
                                              `items.${index}.vendorPrice`,
                                              formattedValue,
                                            );
                                          },
                                        },
                                      )}
                                      className="p-2"
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "." &&
                                          e.target.value.includes(".")
                                        ) {
                                          e.preventDefault();
                                        }
                                      }}
                                      placeholder="0.00"
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
                                <tr key={item.customer_id}>
                                  <td style={{ position: "relative" }}>
                                    <Select
                                      required={
                                        !!getValues(`items2.${index}.companyId`)
                                      }
                                      options={
                                        customertable.length === 1
                                          ? customerData.map((customer) => ({
                                              value: customer.customer_id,
                                              label: customer.company_name,
                                              data: customer,
                                            }))
                                          : customerData
                                              .filter(
                                                (data) =>
                                                  !selectedCustomers.includes(
                                                    data.customer_id,
                                                  ) ||
                                                  selectedCustomers[index] ===
                                                    data.customer_id,
                                              )
                                              .map((customer) => ({
                                                value: customer.customer_id,
                                                label: customer.company_name,
                                                data: customer,
                                              }))
                                      }
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
                                          // Clear the selection
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

                                          // Clear the price, client code, and client product name
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
                                    />
                                  </td>
                                  <td>
                                    <Form.Control
                                      {...register(
                                        `items2.${index}.companyNature`,
                                      )}
                                      className="p-2"
                                      readOnly
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
                                    <Form.Control
                                      type="text"
                                      required={isCustomerSelected(index)}
                                      {...register(
                                        `items2.${index}.companyPrice`,
                                        {
                                          onChange: (e) => {
                                            const rawValue =
                                              e.target.value.replace(/,/g, "");
                                            const formattedValue =
                                              formatNumber(rawValue);
                                            setValue(
                                              `items2.${index}.companyPrice`,
                                              formattedValue,
                                            );
                                          },
                                        },
                                      )}
                                      className="p-2"
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "." &&
                                          e.target.value.includes(".")
                                        ) {
                                          e.preventDefault();
                                        }
                                      }}
                                      placeholder="0.00"
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

              <div className="row mx-auto p-2 mt-4 mb-4"></div>
              <div className="w-100 text-end mb-3 ">
                <button
                  className="btn btn-outline-secondary title-button mx-3"
                  onClick={() => navigate("/inventory/product-list")}
                >
                  Cancel
                </button>
                <button className="btn btn-primary title-button">Save</button>
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

export default CreateProduct;
