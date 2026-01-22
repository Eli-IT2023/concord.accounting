import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import swal from "sweetalert";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import productUnits from "../../../assets/global/unitofmeasure";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import { constant_productCategory } from "../../../constants/productOptions";
import imageCompression from "browser-image-compression";

const CreateProduct = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [vendorData, setVendorData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [images, setImages] = useState([]);
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const reloadProductCode = () => {
    axios
      .get(BASE_URL + "/product/lastCode")
      .then((res) => {
        const codes =
          res.data !== null ? res.data.toString().padStart(6, "0") : "000001";
        setValue("productCode", codes);
        setIsLoading(false);
      })
      .catch((err) => console.log(err));
  };

  const fetchVendorData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/getVendors`);
      setVendorData(res.data);
      // setVendorData([]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const compressedImages = [];
    for (const file of files) {
      // Compress image
      try {
        const options = {
          maxSizeMB: 5, //  keep under 5MB
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        if (compressedFile.size > MAX_IMAGE_SIZE_BYTES) {
          swal({
            icon: "error",
            title: "File Too Large",
            text: `The file "${file.name}" exceeds the ${MAX_IMAGE_SIZE_MB} MB limit even after compression.`,
          });
          return;
        }
        compressedImages.push(compressedFile);
      } catch (err) {
        swal({
          icon: "error",
          title: "Compression Error",
          text: `Failed to compress "${file.name}".`,
        });
        return;
      }
    }
    setImages(compressedImages);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadProductCode();
      fetchVendorData();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const { register, control, setValue, getValues, watch } = useForm({
    defaultValues: {
      tagAllVendor: false,
      productCode: "",
      productName: "",
      productCategory: "",
      productUnit: "",
      remarks: "",
      productThreshold: "",
      items: [
        {
          companyName: "",
          vendorId: "",
          vendorEmail: "",
          vendoryCountry: "",
          vendorPrice: 0,
        },
      ],
    },
  });

  const {
    fields: vendortable,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "items",
  });
  const itemsValues = useWatch({
    control,
    name: "items",
    defaultValue: [],
  });

  // Open modal at selected image
  const handleViewImage = (index) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  // Next/Prev handlers
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const addNewItem = () => {
    if (
      itemsValues.some((item) => item.companyName === "") ||
      itemsValues.length === 0
    ) {
      swal({
        icon: "warning",
        title: "Vendor Required",
        text: "Please select a vendor before continuing.",
      });
      return;
    }

    if (
      itemsValues.some(
        (item) => parseFloat(String(item.vendorPrice).replace(/,/g, "")) === 0
      )
    ) {
      swal({
        icon: "warning",
        title: "Price Required",
        text: "Price must be greater than zero. Please check your input.",
      });
      return;
    }

    append({
      companyName: "",
      vendorId: "",
      vendorEmail: "",
      vendoryCountry: "",
      // invoice_date: { [Op.between]: [thisFromdate, thisTodate] },
      vendorPrice: 0,
    });
  };

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
    } else {
      if (
        itemsValues.some(
          (item) => parseFloat(String(item.vendorPrice).replace(/,/g, "")) === 0
        )
      ) {
        swal({
          icon: "warning",
          title: "Price Required",
          text: "Price must be greater than zero. Please check your input.",
        });
        return;
      }

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
            productThreshold: parseFloat(
              String(formData.productThreshold).replace(/,/g, "")
            ),
            items: formData.items.map((item) => ({
              ...item,
              vendorPrice:
                parseFloat(String(item.vendorPrice).replace(/,/g, "")) || 0,
            })),
            userLoggedID,
          };

          const data = new FormData();
          Object.entries(formattedFormData).forEach(([key, value]) => {
            if (key === "items") {
              data.append(key, JSON.stringify(value));
            } else {
              data.append(key, value);
            }
          });
          images.forEach((img) => data.append("images", img));

          axios
            .post(`${BASE_URL}/product/createProduct`, data, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Product created successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                  dangerMode: true,
                }).then(() => {
                  navigate("/inventory/product-list");
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
            })
            .catch((error) => {
              // Handle Product Name Already Exists Error
              if (error.response && error.response.status === 409) {
                const wrapper = document.createElement("div");
                wrapper.classList.add("center-swal-text");
                wrapper.innerHTML =
                  "Please choose a unique name for the product to proceed.";
                swal({
                  icon: "error",
                  title: error.response.data.message,
                  content: wrapper,
                  button: "OK",
                });
                return;
              }
            });
        }
      });
    }
    setValidated(true);
  };

  //Function for formatting the number using userForm
  const formatNumber = (value) => {
    if (!value) return ""; // Handle empty input
    // Remove non-numeric characters except for the decimal point
    let inputValue = value.replace(/[^0-9.]/g, "");
    // Split into integer and decimal parts
    let [integerPart, decimalPart] = inputValue.split(".");
    // Format the integer part with commas
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    // Combine integer and decimal parts (if any)
    return decimalPart !== undefined
      ? `${integerPart}.${decimalPart}`
      : integerPart;
  };

  console.log(watch(`items.${0}.vendorName`) === null);

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
                  <div className="col-md-2">
                    <Form.Label htmlFor="productCode">Product Code</Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      id="productCode"
                      {...register("productCode")}
                      readOnly
                    />
                  </div>
                  <div className="col-md-5">
                    <Form.Label htmlFor="productName">Product Name</Form.Label>
                    <Form.Control
                      type="text"
                      className="p-3"
                      placeholder="Enter Item Name"
                      id="productName"
                      {...register("productName")}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <Form.Label htmlFor="productCategory">
                      Product Category
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
                      {constant_productCategory.map((product, index) => (
                        <option key={index} value={product}>
                          {product}
                        </option>
                      ))}
                      {/* <option value="Consumable">Consumable</option>
                  <option value="Fixed Asset">Fixed Asset</option> */}
                    </Form.Select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <Form.Label htmlFor="productImages">
                      Product Images
                    </Form.Label>
                    <Form.Control
                      type="file"
                      id="productImages"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <div className="mt-2">
                      {images.length > 0 &&
                        Array.from(images).map((img, idx) => (
                          <span key={idx} className="badge bg-info me-1">
                            {img.name}
                          </span>
                        ))}
                    </div>
                    {/* VIEW BUTTON */}
                    {images.length > 0 && (
                      <Button
                        variant="info"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleViewImage(0)}
                      >
                        View All Images
                      </Button>
                    )}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <Form.Label htmlFor="productUnit">
                      Unit of Measure
                    </Form.Label>
                    <Form.Select
                      className="form-select p-3"
                      id="productUnit"
                      {...register("productUnit")}
                      required
                    >
                      <option disabled value="">
                        Select Unit
                      </option>
                      {productUnits.map((unit, index) => (
                        <option key={index} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <div className="col-md-6"></div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
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
                        // {...register("productThreshold")}
                        {...register(`productThreshold`, {
                          onChange: (e) => {
                            const formattedValue = formatNumber(e.target.value);
                            setValue(`productThreshold`, formattedValue);
                          },
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <Form.Group className="form-check form-switch d-flex gap-2 justify-content-end align-items-end h-100">
                      <input
                        type="checkbox"
                        className="form-check-input p-2 mb-1"
                        id="tag-all-vendor"
                        {...register("tagAllVendor")}
                        role="switch"
                      />

                      <Form.Label htmlFor="tag-all-vendor" className="mb-0">
                        Tag All Vendor
                      </Form.Label>
                    </Form.Group>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="p-2">Company Name</th>
                      <th className="p-2">Contact Person</th>
                      <th className="p-2">Company Email</th>
                      <th className="p-2">Country</th>
                      <th className="p-2">Price</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendortable.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          {/* <select
                            required
                            {...register(`items.${index}.vendorId`)}
                            className="form-select form-select-sm p-2"
                            onChange={(e) => {
                              const selectedValue = String(e.target.value, 10);
                              const selectedVendor = vendorData.find(
                                (p) => String(p.id) === selectedValue
                              );

                              if (selectedVendor) {
                                setValue(
                                  `items.${index}.companyName`,
                                  selectedVendor.company_name
                                );
                                setValue(
                                  `items.${index}.vendorName`,
                                  `${selectedVendor.fname} ${selectedVendor.lname}`
                                );
                                setValue(
                                  `items.${index}.vendorEmail`,
                                  selectedVendor.company_email
                                );
                                setValue(
                                  `items.${index}.vendorCountry`,
                                  selectedVendor.company_country
                                );

                                setSelectedVendors((prev) => {
                                  const updated = [...prev];
                                  updated[index] = selectedValue;
                                  return updated;
                                });
                              }
                            }}
                            onMouseDown={(e) => {
                              if (
                                vendorData.length === 0 &&
                                selectedVendors.length === 0
                              ) {
                                e.preventDefault();
                                swal({
                                  icon: "warning",
                                  title: "No Vendor Found",
                                  text: "No vendors found. Please create one first.",
                                });
                                return;
                              }
                            }}
                          >
                            <option value="" disabled>
                              Select Vendor
                            </option>
                            {(vendortable.length === 1
                              ? vendorData
                              : vendorData.filter(
                                  (data) =>
                                    !selectedVendors.includes(data.id) ||
                                    selectedVendors[index] === data.id
                                )
                            ).map((data) => (
                              <option key={data.id} value={data.id}>
                                {data.company_name}
                              </option>
                            ))}
                          </select> */}
                          <Controller
                            name={`items.${index}.vendorId`}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                              const vendorOptions = (
                                vendortable.length === 1
                                  ? vendorData
                                  : vendorData.filter(
                                      (data) =>
                                        !selectedVendors.includes(data.id) ||
                                        selectedVendors[index] === data.id
                                    )
                              ).map((data) => ({
                                value: data.id,
                                label: data.company_name || `${data.fname} ${data.lname}`,
                              }));

                              return (
                                <Select
                                  {...field}
                                  options={vendorOptions}
                                  value={
                                    vendorOptions.find(
                                      (opt) => opt.value === field.value
                                    ) || null
                                  }
                                  onChange={(selectedOption) => {
                                    field.onChange(selectedOption?.value); // update form state
                                    const selectedValue = String(
                                      selectedOption.value,
                                      10
                                    );
                                    const selectedVendor = vendorData.find(
                                      (p) => String(p.id) === selectedValue
                                    );

                                    if (selectedVendor) {
                                      setValue(
                                        `items.${index}.companyName`,
                                        selectedVendor.company_name
                                      );
                                      setValue(
                                        `items.${index}.vendorName`,
                                        selectedVendor.fname == null ||
                                          selectedVendor.lname == null
                                          ? selectedVendor.company_name
                                          : `${selectedVendor.fname} ${selectedVendor.lname}`
                                      );
                                      setValue(
                                        `items.${index}.vendorEmail`,
                                        selectedVendor.company_email
                                      );
                                      setValue(
                                        `items.${index}.vendorCountry`,
                                        selectedVendor.company_country
                                      );

                                      setSelectedVendors((prev) => {
                                        const updated = [...prev];
                                        updated[index] = selectedValue;
                                        return updated;
                                      });
                                    }
                                  }}
                                  onMenuOpen={() => {
                                    if (
                                      vendorData.length === 0 &&
                                      selectedVendors.length === 0
                                    ) {
                                      swal({
                                        icon: "warning",
                                        title: "No Vendor Found",
                                        text: "No vendors found. Please create one first.",
                                      });
                                      return;
                                    }
                                  }}
                                  menuIsOpen={
                                    vendorData.length === 0 &&
                                    selectedVendors.length === 0
                                      ? false
                                      : undefined
                                  }
                                  menuPortalTarget={document.body}
                                  placeholder="Select Vendor"
                                  styles={selectCustomStyles(
                                    watch(`items.${index}.vendorId`),
                                    validated,
                                    "0.12rem"
                                  )}
                                  isSearchable
                                />
                              );
                            }}
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
                            {...register(`items.${index}.vendorEmail`)}
                            className="p-2"
                            readOnly
                          />
                        </td>
                        <td>
                          <Form.Control
                            {...register(`items.${index}.vendorCountry`)}
                            className="p-2"
                            readOnly
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            onInput={onInputFloat}
                            required
                            // {...register(`items.${index}.vendorPrice`)}
                            {...register(`items.${index}.vendorPrice`, {
                              onChange: (e) => {
                                const formattedValue = formatNumber(
                                  e.target.value
                                );
                                setValue(
                                  `items.${index}.vendorPrice`,
                                  formattedValue
                                );
                              },
                            })}
                            className="p-2"
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              if (vendortable.length > 1) {
                                remove(index);
                                setSelectedVendors((prev) =>
                                  prev.filter((_, i) => i !== index)
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
              <div className="row mx-auto p-2 mt-4 mb-4"></div>
              <div className="w-100 text-end mb-3 ">
                <button
                  type="button"
                  className="btn btn-secondary title-button mx-3"
                  onClick={() => navigate("/inventory/product-list")}
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

        <Modal
          show={showImageModal}
          onHide={() => setShowImageModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Image {currentImageIndex + 1} of {images.length}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column align-items-center">
            {images.length > 0 && (
              <img
                src={URL.createObjectURL(images[currentImageIndex])}
                alt={images[currentImageIndex].name}
                style={{ maxWidth: "100%", maxHeight: "60vh" }}
              />
            )}
            <div className="mt-3 d-flex justify-content-between w-100">
              <Button
                variant="secondary"
                onClick={handlePrevImage}
                disabled={images.length <= 1}
              >
                &lt;
              </Button>
              <Button
                variant="secondary"
                onClick={handleNextImage}
                disabled={images.length <= 1}
              >
                &gt;
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default CreateProduct;
