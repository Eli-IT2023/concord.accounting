import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Form } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import swal from "sweetalert";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import productUnits from "../../../assets/global/unitofmeasure";
import { Link } from "react-router-dom";
import NoAccess from "../../../assets/img/NoAccess.png";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import Select from "react-select";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import { constant_productCategory } from "../../../constants/productOptions";
import imageCompression from "browser-image-compression";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";

const UpdateProduct = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const { id } = useParams();
  const [validated, setValidated] = useState(false);
  const [vendorData, setVendorData] = useState([]);
  const [allTaggedVendor, setAllTaggedVendor] = useState([]);
  const [deletedVendorIdList, setDeletedVendorIdList] = useState([]);
  const [images, setImages] = useState([]);
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  const [existingImages, setExistingImages] = useState([]);
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const vendorListPagination = useServerPagination(
    `${BASE_URL}/productTagVendor/fetchProductVendor`,
    10,
    { id: id }
  );

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const fetchVendorData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/getVendors`);
      setVendorData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // For validation of duplicate vendor
  const fetchAllTaggedVendor = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/productTagVendor/all-vendor/${id}`
      );
      setAllTaggedVendor(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const compressedImages = [];
    for (const file of files) {
      try {
        const options = {
          maxSizeMB: MAX_IMAGE_SIZE_MB,
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
    fetchVendorData();
    fetchAllTaggedVendor();
  }, []);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/product/product-images/${id}`)
      .then((res) => {
        setExistingImages(res.data || []);
      })
      .catch((err) => console.log(err));
  }, [id]);

  const { register, control, setValue, getValues, watch } = useForm({
    defaultValues: {
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
          vendorName: "",
          vendorEmail: "",
          vendorRole: "",
          vendorPrice: 0,
        },
      ],
    },
  });

  const {
    fields: vendortable,
    append,
    prepend,
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

  const handleViewImages = () => {
    const allImages = [
      ...existingImages.map((img) => ({
        type: "existing",
        id: img.id,
        src: `data:image/jpeg;base64,${img.product_image}`,
        label: `Existing #${img.id}`,
      })),
      ...images.map((img, idx) => ({
        type: "new",
        id: idx,
        src: URL.createObjectURL(img),
        label: img.name || `New #${idx + 1}`,
      })),
    ];
    setModalImages(allImages);
    setCurrentImageIndex(0);
    setShowImageModal(true);
  };

  // Select button handler
  const handleSelectImage = (idx) => {
    setCurrentImageIndex(idx);
  };

  // Next/Prev handlers
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? modalImages.length - 1 : prev - 1
    );
  };
  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === modalImages.length - 1 ? 0 : prev + 1
    );
  };

  const addNewItem = () => {
    if (itemsValues.some((item) => item.companyName === "")) {
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

    prepend({
      companyName: "",
      vendorId: "",
      vendorName: "",
      vendorEmail: "",
      vendorRole: "",
      vendorPrice: 0,
      newVendor: true,
    });
  };

  useEffect(() => {
    axios
      .get(`${BASE_URL}/product/fetchProductEdit`, {
        params: { id: id },
      })
      .then((res) => {
        if (res.data) {
          const productData = res.data[0];
          setValue("productCode", productData.product_code);
          setValue("productName", productData.product_name);
          setValue("productCategory", productData.product_category);
          setValue("productUnit", productData.unit_of_measure);
          setValue("remarks", productData.description);
          setValue("productThreshold", productData.threshold);
        }
      })
      .catch((err) => console.log(err));
  }, [id, setValue]);

  useEffect(() => {
    if (vendorListPagination.data) {
      setValue("items", []);
      vendorListPagination.data.forEach((vendor) => {
        append({
          companyName: vendor.vendor.company_name,
          vendorId: vendor.vendor.id,
          vendorName: `${vendor.vendor.fname} ${vendor.vendor.lname}`,
          vendorEmail: vendor.vendor.company_email,
          vendorCountry: vendor.vendor.company_country,
          vendorPrice: vendor.product_price.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        });
      });
    }
  }, [id, append, setValue, vendorListPagination.data]);

  const update = async (e) => {
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
        title: "Update this product?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const formData = getValues();

          const formattedFormData = {
            ...formData,
            items: formData.items.map((item) => ({
              ...item,
              vendorPrice:
                parseFloat(String(item.vendorPrice).replace(/,/g, "")) || 0,
            })),
            deletedVendorIdList,
          };

          // Use FormData for file upload
          const data = new FormData();
          data.append("id", id);
          Object.entries(formattedFormData).forEach(([key, value]) => {
            if (key === "items") {
              data.append(key, JSON.stringify(value));
            } else {
              data.append(key, value);
            }
          });
          images.forEach((img) => data.append("images", img));
          if (removeImageIds.length > 0) {
            data.append("removeImageIds", JSON.stringify(removeImageIds));
          }
          data.append("userLoggedID", userLoggedID);

          axios
            .put(`${BASE_URL}/product/updateProduct`, data, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((res) => {
              if (res.status >= 200 && res.status < 300) {
                swal({
                  title: "Success",
                  text: "Product updated successfully",
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

  const formatNumber = (value) => {
    if (!value) return ""; // Handle empty input

    let inputValue = value.replace(/[^0-9.]/g, "");

    let [integerPart, decimalPart] = inputValue.split(".");
    // Format the integer part with commas
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    // Combine integer and decimal parts (if any)
    return decimalPart !== undefined
      ? `${integerPart}.${decimalPart}`
      : integerPart;
  };

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
                      <i class="fa-solid fa-arrow-left"></i>
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
                      {/* Show new images to be uploaded */}
                      {images.length > 0 &&
                        Array.from(images).map((img, idx) => (
                          <span key={idx} className="badge bg-info me-1">
                            {img.name}
                          </span>
                        ))}
                    </div>
                    <div className="mt-2">
                      {/* Show existing images with remove option */}
                      {existingImages.length > 0 &&
                        existingImages.map((img) => (
                          <span
                            key={img.id}
                            className="badge bg-secondary me-1"
                          >
                            <img
                              src={`data:image/jpeg;base64,${img.product_image}`}
                              alt="Product"
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: "cover",
                                marginRight: 4,
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-danger ms-1"
                              onClick={() => {
                                setRemoveImageIds((prev) => [...prev, img.id]);
                                setExistingImages((prev) =>
                                  prev.filter((i) => i.id !== img.id)
                                );
                              }}
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                    </div>
                    {/* VIEW BUTTON */}
                    {(existingImages.length > 0 || images.length > 0) && (
                      <Button
                        variant="info"
                        size="sm"
                        className="mt-2"
                        onClick={handleViewImages}
                      >
                        View Images
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
                        type="number"
                        className="p-3"
                        id="productThreshold"
                        placeholder="Input quantity"
                        {...register("productThreshold")}
                        onKeyDown={(e) => {
                          ["-", "e", "+"].includes(e.key) && e.preventDefault();
                        }}
                        min={0}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6"></div>
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
                              }
                            }}
                          >
                            <option value="" disabled>
                              Select Vendor
                            </option>
                            {vendorData.map((data) => (
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
                              const vendorOptions = vendorData.map((item) => ({
                                value: item.id,
                                label: item.company_name || `${item.fname} ${item.lname}` 
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
                                    const checkExistingVendor = (
                                      vendorList,
                                      field
                                    ) =>
                                      vendorList.some(
                                        (item) =>
                                          item[field] === selectedOption?.value
                                      );

                                    const isExisting =
                                      // Check for Current Page
                                      checkExistingVendor(
                                        itemsValues,
                                        "vendorId" ||
                                          // Check for All Pages
                                          checkExistingVendor(
                                            allTaggedVendor,
                                            "vendor.id"
                                          )
                                      );

                                    if (isExisting) {
                                      swal({
                                        icon: "error",
                                        title: "Duplicate Vendor",
                                        text: "Vendor already exists in the list",
                                        timer: 2000,
                                        buttons: false,
                                      });

                                      return;
                                    }

                                    field.onChange(selectedOption?.value); // update form state
                                    const selectedValue = String(
                                      selectedOption?.value,
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
                                    }
                                  }}
                                  menuPortalTarget={document.body}
                                  placeholder="Select Vendor"
                                  styles={selectCustomStyles(
                                    watch(`items.${index}.vendorId`),
                                    validated,
                                    "0.12rem"
                                  )}
                                  isSearchable
                                  required
                                />
                              );
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            {...register(
                              watch(`items.${index}.vendorName`) === "null null"
                                ? `items.${index}.companyName`
                                : `items.${index}.vendorName`
                            )}
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
                                // If the vendor is existing, add as deleted vendor
                                const selectedVendor = vendortable[index];
                                !selectedVendor.newVendor &&
                                  setDeletedVendorIdList((prev) => [
                                    ...prev,
                                    selectedVendor.vendorId,
                                  ]);

                                remove(index);
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
              <div>
                <PaginationControls {...vendorListPagination} />
              </div>
              <div className="row mx-auto p-2 mt-4 mb-4"></div>
              {authrztn.includes("ProductList-Edit") && (
                <div className="w-100 mb-3 d-flex flex-row align-items-end justify-content-end">
                  <button
                    className="btn btn-secondary title-button mx-3"
                    type="button"
                    onClick={() => navigate("/inventory/product-list")}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary title-button"
                    type="submit"
                  >
                    Save
                  </button>
                </div>
              )}
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
            <Modal.Title>Image Viewer</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column align-items-center">
            {modalImages.length > 0 && (
              <>
                <img
                  src={modalImages[currentImageIndex].src}
                  alt={modalImages[currentImageIndex].label}
                  style={{ maxWidth: "100%", maxHeight: "60vh" }}
                />
                <div className="mt-3 d-flex justify-content-between w-100">
                  <Button
                    variant="secondary"
                    onClick={handlePrevImage}
                    disabled={modalImages.length <= 1}
                  >
                    &lt;
                  </Button>
                  <span>
                    {currentImageIndex + 1} of {modalImages.length}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={handleNextImage}
                    disabled={modalImages.length <= 1}
                  >
                    &gt;
                  </Button>
                </div>
              </>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default UpdateProduct;
