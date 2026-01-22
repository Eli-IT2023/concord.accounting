import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import { Tab, Tabs } from "react-bootstrap";
import TagTab from "./TabComponents/TagTab";
import PurchaseTab from "./TabComponents/PurchaseTab";
import { useLocation } from "react-router-dom";
import swal from "sweetalert";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useParams, useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { selectCustomStyles } from "../../../assets/global/selectCustomStyles";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination";
import {
  PaginationControls,
  usePagination,
} from "../../../hooks/customHook/paginationHook/usePagination";
// import { ThreeDot } from "react-loading-indicators";
// import NoAccess from "../../../assets/img/NoAccess.png";

const UpdateVendor = ({ authrztn }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const { id } = useParams();
  const pagination = useServerPagination(
    BASE_URL + "/vendors/fetchProduct",
    10,
    {
      id,
    }
  );
  const [newItemList, setNewItemList] = useState([]);
  const yearRef = useRef();
  const [showModal, setShowModal] = useState(false);
  const [validated, setValidated] = useState(false);
  const [productTagVendorList, setProductTagVendorList] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);

  // fetch data
  const [companyName, setcompanyName] = useState("");
  const [companyNature, setcompanyNature] = useState("");
  const [emailAddress, setemailAddress] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [designation, setDesignation] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [mname, setMname] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [dob, setDob] = useState(new Date());
  const [gender, setGender] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [contactNo2, setContactNo2] = useState("");
  const [tin, setTin] = useState("");
  const [position, setPosition] = useState("");
  const [productData, setProductData] = useState([]);
  const [productFetch, setProductFetch] = useState([]);
  const [status, setStatus] = useState(null);
  const [supplierCode, setSupplierCode] = useState("");

  const location = useLocation();
  const [activeTab, setActiveTab] = useState("tag");

  //   fetch url ID
  // Fetch data
  // const [showData, setShowData] = useState([]);

  // const reloadTable = () => {
  //   axios.get(BASE_URL + "/vendors/fetchVendors").then((res) => {
  //     setShowData(res.data);
  //   });
  // };

  const [currency, setCurrency] = useState([]);
  const [currencyID, setCurrencyID] = useState("");

  const [selectYear, setSelectYear] = useState(false);
  const [yearList, setYearList] = useState([
    [2010, 2011, 2012, 2013],
    [2014, 2015, 2016, 2017],
    [2018, 2019, 2020, 2021],
    [2022, 2023, 2024, 2025],
  ]);

  const generateYears = (year) => {
    setYearList(() => {
      const updated = [];
      const currentYear = new Date().getFullYear();

      // Generate years based on current year or selected year
      const yearList = Array.from(
        { length: 16 },
        (_, i) => (year ? year : currentYear) - 16 + i + 1
      );

      // Divide array by 4 items
      for (let i = 0; i < yearList.length; i += 4) {
        updated.push(yearList.slice(i, i + 4));
      }

      return updated;
    });
  };

  const increaseYear = (changeYear) => {
    setYearList((prev) => {
      const updated = prev.map((item) => item.map((year) => year + 10));
      changeYear(updated[3][3]);

      return updated;
    });
  };

  const decreaseYear = (changeYear) => {
    setYearList((prev) => {
      const updated = prev.map((item) => item.map((year) => year - 10));
      changeYear(updated[3][3]);

      return updated;
    });
  };

  function range(start, end, step = 1) {
    const result = [];
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
    return result;
  }

  const years = range(1900, new Date().getFullYear() + 1, 1);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const reloadCurrency = () => {
    axios.get(BASE_URL + "/currency/fetchCurrency").then((res) => {
      setCurrency(res.data);
    });
  };
  //fetching of product Data
  const reloadProduct = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/getProductData`);
      setProductData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // To fetch Product Vendor Relationship without the pagination,
  // used for validation in selecting product to avoid duplicates
  const fetchProductTagVendor = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/vendors/product-tag-vendor`, {
        params: {
          id,
        },
      });

      if (res.data) {
        setProductTagVendorList(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProduct = (newItemCount) => {
    // axios
    //   .get(BASE_URL + "/vendors/fetchProduct", {
    //     params: {
    //       id,
    //     },
    //   })
    //   .then((res) => {
    //     const transformedData = res.data.data.map((data) => ({
    //       vendor_prod_id: data.id,
    //       prod_id: data.product_list.product_id,
    //       prod_code: data.product_list.product_code,
    //       prod_name: data.product_list.product_name,
    //       prod_cat: data.product_list.product_category,
    //       prod_uom: data.product_list.unit_of_measure,
    //       vendor_prod_price: data.product_price,
    //       vendor_prod_status: data.status,
    //       type: "old",
    //     }));

    //     setProductFetch(transformedData);
    //   });
    pagination.updateParams({
      id,
    });
  };

  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const fetchDataEdit = () => {
    try {
      axios
        .get(BASE_URL + "/vendors/fetchVendorsedit", {
          params: {
            id,
          },
        })
        .then((res) => {
          const status = res.data[0].status === "Active" ? true : false;
          setcompanyName(res.data[0].company_name);
          setcompanyNature(res.data[0].company_nature);
          setemailAddress(res.data[0].company_email);
          setCompanyAddress(res.data[0].company_address);
          setCity(res.data[0].company_city);
          setCountry(res.data[0].company_country);
          setDesignation(res.data[0].company_designation);
          setFname(res.data[0].fname);
          setLname(res.data[0].lname);
          setMname(res.data[0].mname);
          setCivilStatus(res.data[0].civil_status);
          setDob(res.data[0].dob);
          setGender(res.data[0].gender);
          setContactNo(res.data[0].contact);
          setContactNo2(res.data[0].contact2);
          setTin(res.data[0].tin_number);
          setPosition(res.data[0].position);
          setCurrencyID(res.data[0].currency_id);
          setStatus(status);
          setSupplierCode(res.data[0].supplier_code);

          const dateOfBirth = new Date(res.data[0].dob).getFullYear();
          generateYears(dateOfBirth);
        });
    } catch (error) {
      console.error("Error updating Vendors:", error);
      swal({
        title: "Error!",
        text: "There was an error updating the vendors.",
        icon: "error",
        buttons: false,
        timer: 2000,
      });
    }
  };

  useEffect(() => {
    fetchCountries();
    reloadProduct();
    reloadCurrency();
    fetchDataEdit();
    fetchProduct();
    fetchProductTagVendor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   fetchProduct();
  // }, [newItemList.length]);

  console.log(pagination);

  useEffect(() => {
    if (pagination.data) {
      const transformedData = pagination.data.map((data) => ({
        vendor_prod_id: data.id,
        prod_id: data.product_list.product_id,
        prod_code: data.product_list.product_code,
        prod_name: data.product_list.product_name,
        prod_cat: data.product_list.product_category,
        prod_uom: data.product_list.unit_of_measure,
        vendor_prod_price: data.product_price,
        vendor_prod_status: data.status,
        type: "old",
      }));

      setProductFetch(transformedData);
    }
  }, [pagination.data]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setSelectYear(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClose = () => {
    setShowModal(false);
  };

  // country
  // const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);

  // Function to fetch country data
  const fetchCountries = async () => {
    try {
      const response = await axios.get(
        "https://restcountries.com/v3.1/all?fields=name,cca3"
      );
      const countries = response.data.map((country) => ({
        value: country.name.common,
        label: `${country.name.common} (${country.cca3})`, // Concatenate the country name with the country tag
      }));

      // Sort countries alphabetically by name
      countries.sort((a, b) => (a.label > b.label ? 1 : -1));

      setCountryOptions(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const vendorProductRemove = (
    prodId,
    productVendorID,
    productVendorStatus,
    index,
    type
  ) => {
    console.log(productVendorID);

    if (productFetch.some((item) => item.type === "new") && type === "old") {
      swal({
        icon: "warning",
        title: "Unsaved Changes Detected",
        text: "New items must be saved before you can continue to update this product.",
      });

      return;
    }

    if (productVendorID === 0) {
      setProductFetch((prev) => {
        return prev.filter((item, i) => item.prod_id !== prodId);
      });
      setNewItemList((prev) => {
        return prev.filter((item, i) => item.prod_id !== prodId);
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
        axios
          .post(BASE_URL + "/vendors/removeVendorProduct", null, {
            params: {
              productVendorID,
              productVendorStatus,
              userLoggedID,
            },
          })
          .then((res) => {
            if (res.status === 200) {
              swal({
                title: "Success!",
                text: "Vendors successfully updated.",
                icon: "success",
                buttons: false,
                timer: 2000,
              }).then(() => {
                fetchProduct();
              });
            } else {
              swal({
                title: "Error!",
                text: "Something went wrong, please try again.",
                icon: "error",
                buttons: false,
                timer: 2000,
              });
            }
          });
      }
    });
  };

  // Define the product table
  // const fetchProductTable = [
  //   {
  //     name: "Product Code",
  //     selector: (row) => row.product_list.product_code,
  //   },
  //   {
  //     name: "Name",
  //     selector: (row) => row.product_list.product_name,
  //   },
  //   {
  //     name: "Category",
  //     selector: (row) => row.product_list.product_category,
  //   },
  //   {
  //     name: "Unit of Measure",
  //     selector: (row) => row.product_list.unit_of_measure,
  //   },
  //   {
  //     name: "Sell Price",
  //     selector: (row) => row.product_price,
  //   },
  //   {
  //     name: "Status",
  //     selector: (row) => (
  //       <span
  //         style={{
  //           color: row.status === "Active" ? "green" : "red",
  //           border: `1px solid ${row.status === "Active" ? "green" : "red"}`,
  //           padding: "2px 15px",
  //           borderRadius: "12px",
  //           display: "inline-block",
  //         }}
  //       >
  //         {row.status}
  //       </span>
  //     ),
  //   },
  //   {
  //     name: "",
  //     selector: (row) => (
  //       <>
  //         {/* Status button */}
  //         <button
  //           className={`btn d-flex align-items-center justify-content-center ${
  //             row.status === "Active"
  //               ? "btn-outline-danger custom-btn-danger"
  //               : "btn-outline-primary custom-btn-primary"
  //           }`}
  //           onClick={() => vendorProductRemove(row.id, row.status)}
  //           style={{
  //             cursor: "pointer",
  //             fontSize: "16px",
  //             background: "none",
  //           }}
  //         >
  //           <i
  //             className={`fa-solid ${
  //               row.status === "Active" ? "fa-times fs-5" : "fa-check fs-5"
  //             }`}
  //           ></i>
  //         </button>
  //       </>
  //     ),
  //   },
  // ];

  const handleUpdate = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
        buttons: false,
        timer: 2000,
      });
    } else {
      swal({
        title: "Update this vendors?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          try {
            axios
              .post(BASE_URL + "/vendors/updateVendors", {
                companyName,
                companyNature,
                emailAddress,
                companyAddress,
                city,
                country,
                designation,
                fname,
                mname,
                lname,
                civilStatus,
                dob,
                gender,
                contactNo,
                contactNo2,
                tin,
                position,
                id,
                productFetch: [...new Set([...productFetch, ...newItemList])],
                currencyID,
                userLoggedID,
                status,
                supplierCode,
                limit: pagination.itemsPerPage,
                offset: (pagination.currentPage - 1) * pagination.itemsPerPage,
              })
              .then((res) => {
                if (res.status === 200) {
                  setValidated(false);
                  swal({
                    title: "Success!",
                    text: "Vendors successfully updated.",
                    icon: "success",
                    buttons: false,
                    timer: 2000,
                  }).then(() => {
                    fetchProduct();
                  });

                  handleClose();
                  navigate("/purchases/vendors");
                } else if (res.status === 201) {
                  swal({
                    title: "Already Exist!",
                    text: "Vendors duplicated, unable to update.",
                    icon: "warning",
                    buttons: false,
                    timer: 2000,
                  });
                }
              })
              .catch((error) => {
                console.error("Error updating Vendors:", error);
                swal({
                  title: "Error!",
                  text:
                    error.response?.data?.error ||
                    "There was an error updating the vendors.",
                  icon: "error",
                  buttons: false,
                  timer: 2000,
                });
              });
          } catch (error) {
            console.error("Error updating Vendors:", error);
            swal({
              title: "Error!",
              text: "There was an error updating the vendors.",
              icon: "error",
              buttons: false,
              timer: 2000,
            });
          }
        }
      });
    }
    setValidated(true);
  };

  const handleResetToToday = (changeYear, changeMonth) => {
    const currentYear = new Date().getFullYear();

    setDob(new Date());

    generateYears(); // Reset Year List

    changeYear(currentYear); // Set year

    changeMonth(
      months.indexOf(
        months[new Date().getMonth()] // Set month
      )
    );
  };

  const handleDateChange = (date) => {
    const today = new Date();

    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    if (isToday) {
      swal({
        icon: "warning",
        title: "Invalid Birth Date",
        text: "Birth date cannot be today's date. Please select a valid past date.",
      });

      return;
    }

    setDob(date);
  };

  const addNewItem = () => {
    if (
      [...newItemList, ...productFetch].some((item) => item.prod_id === "") ||
      [...newItemList, ...productFetch].some(
        (item) => parseFloat(item.vendor_prod_price) === 0
      )
    ) {
      swal({
        icon: "warning",
        title: "Finish This Item First",
        text: "Please enter a Product Name and a Selling Price greater than zero before adding a new one.",
      });

      return;
    }

    setNewItemList((prev) => [
      ...prev,
      {
        vendor_prod_id: 0,
        prod_id: "",
        prod_code: "",
        prod_name: "",
        prod_cat: "",
        prod_uom: "",
        vendor_prod_price: 0,
        vendor_prod_status: "Active",
        type: "new",
      },
    ]);
  };

  // Product Options for dropdown select
  const productOptions = productData.map((item) => ({
    value: item.product_id,
    label: item.product_name,
  }));

  const currencyList = {
    PHP: "Philippine Peso (Philippines)",
    USD: "US Dollar (United States)",
    CNY: "Chinese Yuan (China)",
    HKD: "Hong Kong Dollar (Hong Kong)",
    EUR: "Euro (European Union)",
    JPY: "Japanese Yen (Japan)",
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, generateYears }, ref) => (
      <input
        type="text"
        className="form-control p-2 w-100"
        style={{
          cursor: "pointer",
          caretColor: "transparent",
        }}
        onClick={() => {
          onClick();

          const dateOfBirth = new Date(dob).getFullYear();

          generateYears(dateOfBirth); // Reset Year List based on selected date of birth
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required
      />
    )
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get("tab");

    if (tabParam === "purchase") {
      setActiveTab("purchase");
    } else {
      setActiveTab("tag");
    }
  }, [location.search]);

  //function to handle back navigation
  const handleBackNavigation = () => {
    const fromState = location.state?.from;

    if (fromState === "purchase-report") {
      navigate("/reports/new-report/purchase_report");
    } else {
      navigate("/purchases/vendors");
    }
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="container-fluid p-3">
        <Form noValidate validated={validated} onSubmit={handleUpdate}>
          <div className="border p-3 shadow-sm rounded">
            <div className="w-100 d-flex flex-row justify-content-between mb-3">
              <h4>
                <button
                  onClick={handleBackNavigation}
                  className="text-dark mx-2 btn btn-link p-0 border-0"
                  style={{ textDecoration: "none" }}
                >
                  <i class="fa-solid fa-arrow-left fs-4"></i>
                </button>
                Vendor Details
              </h4>
              {authrztn.includes("Vendors-Edit") && (
                <button className="btn btn-outline-primary" type="submit">
                  Update Vendor
                </button>
              )}
            </div>
            <div className="w-100 mt-2 d-flex align-items-center">
              <span>General Information</span>
              <hr className="flex-grow-1 mx-3" />
            </div>
            <div className="row mx-auto px-3 pt-3">
              <div className="col-sm mb-2">
                <label htmlFor="">
                  Company Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  className={`form-control ${
                    validated && !companyName.trim() ? "is-invalid" : ""
                  }`}
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setcompanyName(e.target.value)}
                  required
                />
                {validated && !companyName.trim() && (
                  <div className="invalid-feedback d-block">
                    Company name is required.
                  </div>
                )}
              </div>
            </div>
            <div className="row mx-auto p-3">
              <div className="col-sm mb-2">
                <label htmlFor="">Company Name</label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={companyName}
                  onChange={(e) => setcompanyName(e.target.value)}
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">Company Nature</label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={companyNature}
                  onChange={(e) => setcompanyNature(e.target.value)}
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">Email Address</label>
                <input
                  type="email"
                  name=""
                  className="form-control"
                  id=""
                  value={emailAddress}
                  onChange={(e) => setemailAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="row mx-auto p-3">
              <div className="col-12 col-md-4">
                <label htmlFor="">Company Address</label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="">Supplier Code</label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={supplierCode}
                  onChange={(e) => setSupplierCode(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="">City</label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
            <div className="row mx-auto p-3">
              <div className="col-sm mb-2">
                <label>
                  Country <span className="text-danger">*</span>
                </label>
                <Select
                  options={countryOptions}
                  value={countryOptions.find(
                    (option) => option.value === country
                  )}
                  onChange={(selectedOption) =>
                    setCountry(selectedOption ? selectedOption.value : "")
                  }
                  placeholder="Select Country"
                  isClearable
                  isSearchable
                />
              </div>
              <div className="col-sm mb-2">
                <Form.Group className="mb-3" controlId="designation">
                  <label>
                    Designation <span className="text-danger">*</span>
                  </label>
                  <Form.Select
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    <option value="" selected disabled>
                      Select Designation
                    </option>
                    <option value="Local">Local</option>
                    <option value="Overseas">Overseas</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-sm mb-2">
                <span>Currency</span>
                <select
                  value={currencyID}
                  name=""
                  id=""
                  className="form-select"
                  onChange={(e) => setCurrencyID(e.target.value)}
                >
                  <option value="" selected disabled>
                    Select Currency
                  </option>
                  {currency.map((item, index) => (
                    <option key={index} value={item.id}>
                      {item.currency_name} - {currencyList[item.currency_name]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="w-100 mt-2 d-flex align-items-center">
              <span>Contact Information</span>
              <hr className="flex-grow-1 mx-3" />
            </div>
            <div className="row mx-auto p-3">
              <div className="col-sm mb-2">
                <label htmlFor="">
                  First Name
                  {/* <span className="text-danger">*</span> */}
                </label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={fname}
                  onChange={(e) => setFname(e.target.value)}
                  // required
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">
                  Last Name
                  {/* <span className="text-danger">*</span> */}
                </label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={lname}
                  onChange={(e) => setLname(e.target.value)}
                  // required
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">Middle Name</label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={mname}
                  onChange={(e) => setMname(e.target.value)}
                />
              </div>
            </div>
            <div className="row mx-auto p-3">
              <div className="col-sm mb-2">
                <Form.Group className="mb-3" controlId="civilStatus">
                  <label>Civil Status</label>
                  <Form.Select
                    value={civilStatus}
                    onChange={(e) => setCivilStatus(e.target.value)}
                  >
                    <option value="" selected disabled>
                      Select Civil Status
                    </option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">Date of Birth</label>
                {/* <input
                  type="date"
                  name=""
                  id=""
                  className="form-control"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                /> */}
                <CustomDatePicker
                  label={"Birthday"}
                  selected={new Date(dob)}
                  handleDateChange={handleDateChange}
                  CustomInput={CustomInput}
                  validated={validated}
                />
              </div>
              <div className="col-sm mb-2">
                <Form.Group className="mb-3" controlId="gender">
                  <Form.Label>Choose Gender</Form.Label>
                  <div className="row">
                    <div className="col-sm mb-1">
                      <Form.Check
                        type="radio"
                        name="gender"
                        id="male"
                        label="Male"
                        value="Male"
                        checked={gender === "Male"}
                        onChange={(e) => setGender(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-sm mb-1">
                      <Form.Check
                        type="radio"
                        name="gender"
                        id="female"
                        label="Female"
                        value="Female"
                        checked={gender === "Female"}
                        onChange={(e) => setGender(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </Form.Group>
              </div>
            </div>
            <div className="row mx-auto p-3">
              <div className="col-sm mb-2">
                <label htmlFor="">
                  Cellphone No.
                  {/* <span className="text-danger">*</span> */}
                </label>
                <div className="input-group">
                  <span className="input-group-text">+63</span>
                  <input
                    type="text"
                    name=""
                    className="form-control"
                    id=""
                    // required
                    value={contactNo}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setContactNo(value);
                      }
                    }}
                    maxLength={11}
                  />
                </div>
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">Additional Contact No.</label>
                <div className="input-group z-0">
                  <span className="input-group-text">+63</span>
                  <input
                    type="text"
                    name=""
                    className="form-control"
                    id=""
                    // required
                    value={contactNo2}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setContactNo2(value);
                      }
                    }}
                    maxLength={11}
                  />
                </div>
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">TIN</label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={tin}
                  maxLength={15}
                  onChange={(e) => setTin(e.target.value)}
                />
              </div>
              {/* <div className="col-sm mb-2">
                <label htmlFor="">Job Position</label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div> */}
            </div>
          </div>
        </Form>
        <div className="w-100 mt-3 d-flex align-items-center">
          <span>Item List</span>
          <hr className="flex-grow-1 mx-3" />
        </div>

        {/* Tabs Navigation */}
        <div className="w-100 mt-4 container-fluid">
          <Tabs
            transition={false}
            mountOnEnter
            unmountOnExit={false}
            id="item-list-tabs"
            className="mb-3"
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key)}
          >
            <Tab eventKey="tag" title="Tag">
              <TagTab
                newItemList={newItemList}
                productFetch={productFetch}
                productData={productData}
                productTagVendorList={productTagVendorList}
                validated={validated}
                pagination={pagination}
                onInputFloat={onInputFloat}
                vendorProductRemove={vendorProductRemove}
                addNewItem={addNewItem}
                setNewItemList={setNewItemList}
                setProductFetch={setProductFetch}
              />
            </Tab>

            <Tab eventKey="purchase" title="Purchase Transactions">
              <PurchaseTab vendorId={id} />
            </Tab>
          </Tabs>
        </div>
      </div>
      {/* Add Modal */}
      <Modal show={showModal} onHide={handleClose} backdrop="static">
        <Modal.Header className="border-0">
          <Modal.Title>Delete Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="w-100 p-2">
            <h6>Are you sure you want to delete the product?</h6>
          </div>
          <Modal.Footer className="border-0 mt-3">
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
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UpdateVendor;
