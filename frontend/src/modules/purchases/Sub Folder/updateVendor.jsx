import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import { NumericFormat } from "react-number-format";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useParams, useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// import { ThreeDot } from "react-loading-indicators";
// import NoAccess from "../../../assets/img/NoAccess.png";

const UpdateVendor = ({ authrztn, roleType }) => {
  const [startDate, setStartDate] = useState(null);
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const [showModal, setShowModal] = useState(false);
  const [validated, setValidated] = useState(false);
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
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [contactNo2, setContactNo2] = useState("");
  const [tin, setTin] = useState("");
  const [position, setPosition] = useState("");
  const [vat, setVat] = useState("");
  const [status, setStatus] = useState("");
  const [isCountryInvalid, setIsCountryInvalid] = useState(false);

  const [productData, setProductData] = useState([]);
  const [productFetch, setProductFetch] = useState([]);
  //   fetch url ID
  const { id } = useParams();
  // Fetch data
  // const [showData, setShowData] = useState([]);

  // const reloadTable = () => {
  //   axios.get(BASE_URL + "/vendors/fetchVendors").then((res) => {
  //     setShowData(res.data);
  //   });
  // };

  const [currency, setCurrency] = useState([]);
  const [currencyID, setCurrencyID] = useState("");
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

  const fetchProduct = () => {
    axios
      .get(BASE_URL + "/vendors/fetchProduct", {
        params: {
          id,
        },
      })
      .then((res) => {
        console.log(res.data, "THIS IS RESPONSE DATA");
        const transformedData = res.data.map((data) => ({
          vendor_prod_id: data.id,
          prod_id: data.product_list.product_id,
          prod_code: data.product_list.product_code,
          prod_name: data.product_list.product_name,
          prod_cat: data.product_list.product_category,
          prod_uom: data.product_list.prod_packaging.packaging_name,
          vendor_prod_price: data.product_price,
          vendor_prod_previous: data.previous_price.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          vendor_prod_code: data.vendor_product_code,
          vendor_prod_name: data.vendor_product_name,

          vendor_prod_status: data.status,
          type: "old",
        }));

        setProductFetch(transformedData);
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
          setVat(res.data[0].vat);
          setStatus(res.data[0].status);
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
    fetchProduct();
    reloadProduct();
    reloadCurrency();
    fetchDataEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setShowModal(false);
    setShowHistoryModal(false);
  };

  // country
  // const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);

  // Function to fetch country data
  const fetchCountries = async () => {
    try {
      // Try REST Countries API first
      const response = await axios.get(
        "https://restcountries.com/v3.1/all?fields=name,cca3"
      );

      const countries = response.data.map((country) => ({
        value: country.name.common,
        label: `${country.name.common} (${country.cca3})`,
      }));

      countries.sort((a, b) => (a.label > b.label ? 1 : -1));
      setCountryOptions(countries);
    } catch (error) {
      console.error("Error fetching countries from REST API:", error);

      try {
        // Fallback to Country.io
        const namesResponse = await axios.get("http://country.io/names.json");
        const iso3Response = await axios.get("http://country.io/iso3.json");

        const countries = Object.entries(namesResponse.data).map(
          ([code, name]) => ({
            value: name,
            label: `${name} (${iso3Response.data[code] || code})`,
          })
        );

        countries.sort((a, b) => (a.label > b.label ? 1 : -1));
        setCountryOptions(countries);
      } catch (fallbackError) {
        console.error(
          "Error fetching countries from fallback API:",
          fallbackError
        );
        // Final fallback to static list
        fetchCountriesFallback();
      }
    }
  };

  // Add this function - Static fallback for countries
  const fetchCountriesFallback = () => {
    const countries = [
      { value: "Afghanistan", label: "Afghanistan (AFG)" },
      { value: "Albania", label: "Albania (ALB)" },
      { value: "Algeria", label: "Algeria (DZA)" },
      { value: "Andorra", label: "Andorra (AND)" },
      { value: "Angola", label: "Angola (AGO)" },
      { value: "Antigua and Barbuda", label: "Antigua and Barbuda (ATG)" },
      { value: "Argentina", label: "Argentina (ARG)" },
      { value: "Armenia", label: "Armenia (ARM)" },
      { value: "Australia", label: "Australia (AUS)" },
      { value: "Austria", label: "Austria (AUT)" },
      { value: "Azerbaijan", label: "Azerbaijan (AZE)" },
      { value: "Bahamas", label: "Bahamas (BHS)" },
      { value: "Bahrain", label: "Bahrain (BHR)" },
      { value: "Bangladesh", label: "Bangladesh (BGD)" },
      { value: "Barbados", label: "Barbados (BRB)" },
      { value: "Belarus", label: "Belarus (BLR)" },
      { value: "Belgium", label: "Belgium (BEL)" },
      { value: "Belize", label: "Belize (BLZ)" },
      { value: "Benin", label: "Benin (BEN)" },
      { value: "Bhutan", label: "Bhutan (BTN)" },
      { value: "Bolivia", label: "Bolivia (BOL)" },
      {
        value: "Bosnia and Herzegovina",
        label: "Bosnia and Herzegovina (BIH)",
      },
      { value: "Botswana", label: "Botswana (BWA)" },
      { value: "Brazil", label: "Brazil (BRA)" },
      { value: "Brunei", label: "Brunei (BRN)" },
      { value: "Bulgaria", label: "Bulgaria (BGR)" },
      { value: "Burkina Faso", label: "Burkina Faso (BFA)" },
      { value: "Burundi", label: "Burundi (BDI)" },
      { value: "Cabo Verde", label: "Cabo Verde (CPV)" },
      { value: "Cambodia", label: "Cambodia (KHM)" },
      { value: "Cameroon", label: "Cameroon (CMR)" },
      { value: "Canada", label: "Canada (CAN)" },
      {
        value: "Central African Republic",
        label: "Central African Republic (CAF)",
      },
      { value: "Chad", label: "Chad (TCD)" },
      { value: "Chile", label: "Chile (CHL)" },
      { value: "China", label: "China (CHN)" },
      { value: "Colombia", label: "Colombia (COL)" },
      { value: "Comoros", label: "Comoros (COM)" },
      { value: "Congo", label: "Congo (COG)" },
      { value: "Costa Rica", label: "Costa Rica (CRI)" },
      { value: "Croatia", label: "Croatia (HRV)" },
      { value: "Cuba", label: "Cuba (CUB)" },
      { value: "Cyprus", label: "Cyprus (CYP)" },
      { value: "Czech Republic", label: "Czech Republic (CZE)" },
      { value: "Denmark", label: "Denmark (DNK)" },
      { value: "Djibouti", label: "Djibouti (DJI)" },
      { value: "Dominica", label: "Dominica (DMA)" },
      { value: "Dominican Republic", label: "Dominican Republic (DOM)" },
      { value: "Ecuador", label: "Ecuador (ECU)" },
      { value: "Egypt", label: "Egypt (EGY)" },
      { value: "El Salvador", label: "El Salvador (SLV)" },
      { value: "Equatorial Guinea", label: "Equatorial Guinea (GNQ)" },
      { value: "Eritrea", label: "Eritrea (ERI)" },
      { value: "Estonia", label: "Estonia (EST)" },
      { value: "Eswatini", label: "Eswatini (SWZ)" },
      { value: "Ethiopia", label: "Ethiopia (ETH)" },
      { value: "Fiji", label: "Fiji (FJI)" },
      { value: "Finland", label: "Finland (FIN)" },
      { value: "France", label: "France (FRA)" },
      { value: "Gabon", label: "Gabon (GAB)" },
      { value: "Gambia", label: "Gambia (GMB)" },
      { value: "Georgia", label: "Georgia (GEO)" },
      { value: "Germany", label: "Germany (DEU)" },
      { value: "Ghana", label: "Ghana (GHA)" },
      { value: "Greece", label: "Greece (GRC)" },
      { value: "Grenada", label: "Grenada (GRD)" },
      { value: "Guatemala", label: "Guatemala (GTM)" },
      { value: "Guinea", label: "Guinea (GIN)" },
      { value: "Guinea-Bissau", label: "Guinea-Bissau (GNB)" },
      { value: "Guyana", label: "Guyana (GUY)" },
      { value: "Haiti", label: "Haiti (HTI)" },
      { value: "Honduras", label: "Honduras (HND)" },
      { value: "Hungary", label: "Hungary (HUN)" },
      { value: "Iceland", label: "Iceland (ISL)" },
      { value: "India", label: "India (IND)" },
      { value: "Indonesia", label: "Indonesia (IDN)" },
      { value: "Iran", label: "Iran (IRN)" },
      { value: "Iraq", label: "Iraq (IRQ)" },
      { value: "Ireland", label: "Ireland (IRL)" },
      { value: "Israel", label: "Israel (ISR)" },
      { value: "Italy", label: "Italy (ITA)" },
      { value: "Jamaica", label: "Jamaica (JAM)" },
      { value: "Japan", label: "Japan (JPN)" },
      { value: "Jordan", label: "Jordan (JOR)" },
      { value: "Kazakhstan", label: "Kazakhstan (KAZ)" },
      { value: "Kenya", label: "Kenya (KEN)" },
      { value: "Kiribati", label: "Kiribati (KIR)" },
      { value: "Korea, North", label: "Korea, North (PRK)" },
      { value: "Korea, South", label: "Korea, South (KOR)" },
      { value: "Kosovo", label: "Kosovo (XKX)" },
      { value: "Kuwait", label: "Kuwait (KWT)" },
      { value: "Kyrgyzstan", label: "Kyrgyzstan (KGZ)" },
      { value: "Laos", label: "Laos (LAO)" },
      { value: "Latvia", label: "Latvia (LVA)" },
      { value: "Lebanon", label: "Lebanon (LBN)" },
      { value: "Lesotho", label: "Lesotho (LSO)" },
      { value: "Liberia", label: "Liberia (LBR)" },
      { value: "Libya", label: "Libya (LBY)" },
      { value: "Liechtenstein", label: "Liechtenstein (LIE)" },
      { value: "Lithuania", label: "Lithuania (LTU)" },
      { value: "Luxembourg", label: "Luxembourg (LUX)" },
      { value: "Madagascar", label: "Madagascar (MDG)" },
      { value: "Malawi", label: "Malawi (MWI)" },
      { value: "Malaysia", label: "Malaysia (MYS)" },
      { value: "Maldives", label: "Maldives (MDV)" },
      { value: "Mali", label: "Mali (MLI)" },
      { value: "Malta", label: "Malta (MLT)" },
      { value: "Marshall Islands", label: "Marshall Islands (MHL)" },
      { value: "Mauritania", label: "Mauritania (MRT)" },
      { value: "Mauritius", label: "Mauritius (MUS)" },
      { value: "Mexico", label: "Mexico (MEX)" },
      { value: "Micronesia", label: "Micronesia (FSM)" },
      { value: "Moldova", label: "Moldova (MDA)" },
      { value: "Monaco", label: "Monaco (MCO)" },
      { value: "Mongolia", label: "Mongolia (MNG)" },
      { value: "Montenegro", label: "Montenegro (MNE)" },
      { value: "Morocco", label: "Morocco (MAR)" },
      { value: "Mozambique", label: "Mozambique (MOZ)" },
      { value: "Myanmar", label: "Myanmar (MMR)" },
      { value: "Namibia", label: "Namibia (NAM)" },
      { value: "Nauru", label: "Nauru (NRU)" },
      { value: "Nepal", label: "Nepal (NPL)" },
      { value: "Netherlands", label: "Netherlands (NLD)" },
      { value: "New Zealand", label: "New Zealand (NZL)" },
      { value: "Nicaragua", label: "Nicaragua (NIC)" },
      { value: "Niger", label: "Niger (NER)" },
      { value: "Nigeria", label: "Nigeria (NGA)" },
      { value: "North Macedonia", label: "North Macedonia (MKD)" },
      { value: "Norway", label: "Norway (NOR)" },
      { value: "Oman", label: "Oman (OMN)" },
      { value: "Pakistan", label: "Pakistan (PAK)" },
      { value: "Palau", label: "Palau (PLW)" },
      { value: "Palestine", label: "Palestine (PSE)" },
      { value: "Panama", label: "Panama (PAN)" },
      { value: "Papua New Guinea", label: "Papua New Guinea (PNG)" },
      { value: "Paraguay", label: "Paraguay (PRY)" },
      { value: "Peru", label: "Peru (PER)" },
      { value: "Philippines", label: "Philippines (PHL)" },
      { value: "Poland", label: "Poland (POL)" },
      { value: "Portugal", label: "Portugal (PRT)" },
      { value: "Qatar", label: "Qatar (QAT)" },
      { value: "Romania", label: "Romania (ROU)" },
      { value: "Russia", label: "Russia (RUS)" },
      { value: "Rwanda", label: "Rwanda (RWA)" },
      { value: "Saint Kitts and Nevis", label: "Saint Kitts and Nevis (KNA)" },
      { value: "Saint Lucia", label: "Saint Lucia (LCA)" },
      {
        value: "Saint Vincent and the Grenadines",
        label: "Saint Vincent and the Grenadines (VCT)",
      },
      { value: "Samoa", label: "Samoa (WSM)" },
      { value: "San Marino", label: "San Marino (SMR)" },
      { value: "Sao Tome and Principe", label: "Sao Tome and Principe (STP)" },
      { value: "Saudi Arabia", label: "Saudi Arabia (SAU)" },
      { value: "Senegal", label: "Senegal (SEN)" },
      { value: "Serbia", label: "Serbia (SRB)" },
      { value: "Seychelles", label: "Seychelles (SYC)" },
      { value: "Sierra Leone", label: "Sierra Leone (SLE)" },
      { value: "Singapore", label: "Singapore (SGP)" },
      { value: "Slovakia", label: "Slovakia (SVK)" },
      { value: "Slovenia", label: "Slovenia (SVN)" },
      { value: "Solomon Islands", label: "Solomon Islands (SLB)" },
      { value: "Somalia", label: "Somalia (SOM)" },
      { value: "South Africa", label: "South Africa (ZAF)" },
      { value: "South Sudan", label: "South Sudan (SSD)" },
      { value: "Spain", label: "Spain (ESP)" },
      { value: "Sri Lanka", label: "Sri Lanka (LKA)" },
      { value: "Sudan", label: "Sudan (SDN)" },
      { value: "Suriname", label: "Suriname (SUR)" },
      { value: "Sweden", label: "Sweden (SWE)" },
      { value: "Switzerland", label: "Switzerland (CHE)" },
      { value: "Syria", label: "Syria (SYR)" },
      { value: "Taiwan", label: "Taiwan (TWN)" },
      { value: "Tajikistan", label: "Tajikistan (TJK)" },
      { value: "Tanzania", label: "Tanzania (TZA)" },
      { value: "Thailand", label: "Thailand (THA)" },
      { value: "Timor-Leste", label: "Timor-Leste (TLS)" },
      { value: "Togo", label: "Togo (TGO)" },
      { value: "Tonga", label: "Tonga (TON)" },
      { value: "Trinidad and Tobago", label: "Trinidad and Tobago (TTO)" },
      { value: "Tunisia", label: "Tunisia (TUN)" },
      { value: "Turkey", label: "Turkey (TUR)" },
      { value: "Turkmenistan", label: "Turkmenistan (TKM)" },
      { value: "Tuvalu", label: "Tuvalu (TUV)" },
      { value: "Uganda", label: "Uganda (UGA)" },
      { value: "Ukraine", label: "Ukraine (UKR)" },
      { value: "United Arab Emirates", label: "United Arab Emirates (ARE)" },
      { value: "United Kingdom", label: "United Kingdom (GBR)" },
      { value: "United States", label: "United States (USA)" },
      { value: "Uruguay", label: "Uruguay (URY)" },
      { value: "Uzbekistan", label: "Uzbekistan (UZB)" },
      { value: "Vanuatu", label: "Vanuatu (VUT)" },
      { value: "Vatican City", label: "Vatican City (VAT)" },
      { value: "Venezuela", label: "Venezuela (VEN)" },
      { value: "Vietnam", label: "Vietnam (VNM)" },
      { value: "Yemen", label: "Yemen (YEM)" },
      { value: "Zambia", label: "Zambia (ZMB)" },
      { value: "Zimbabwe", label: "Zimbabwe (ZWE)" },
    ];

    countries.sort((a, b) => (a.label > b.label ? 1 : -1));
    setCountryOptions(countries);
  };

  const vendorProductRemove = (productVendorID, productVendorStatus) => {
    console.log(productVendorID);
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

    const isCountryEmpty = !country;
    setIsCountryInvalid(isCountryEmpty);

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
        title: "Update this vendor?",
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
                productFetch,
                currencyID,
                userLoggedID,
                vat,
                status,
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
                  // reloadTable();
                  // navigate("/purchases/vendors");
                  fetchCountries();
                  fetchProduct();
                  reloadProduct();
                  reloadCurrency();
                  fetchDataEdit();
                } else if (res.status === 201) {
                  swal({
                    title: "Already Exist!",
                    text: "Vendors duplicated, unable to update.",
                    icon: "warning",
                    buttons: false,
                    timer: 2000,
                  });
                }
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

  const addNewItem = () => {
    setProductFetch((prev) => [
      ...prev,
      {
        vendor_prod_id: `new_${Date.now()}`, // Use timestamp for unique temp ID
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

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <div className="position-relative">
      <input
        type="text"
        className="form-control w-100" // Added left padding
        style={{
          cursor: "pointer",
          caretColor: "transparent",
        }}
        onClick={onClick}
        value={value}
        ref={ref}
        placeholder="Select Date"
      />
      <span
        onClick={onClick}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
        }}
      >
        <i className="fa-regular fa-calendar"></i>
      </span>
    </div>
  ));

  // price history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [vendorPriceHistoryData, setVendorPriceHistoryData] = useState([]);

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

  const fetchVendorPriceHistory = (vendorId, productId) => {
    axios
      .get(BASE_URL + "/vendors/getVendorHistory", {
        params: {
          vendor_id: vendorId,
          product_id: productId,
        },
      })
      .then((res) => {
        if (res.data) {
          setVendorPriceHistoryData(res.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching vendors history:", error);
      });
  };

  const removeNewItem = (itemId) => {
    setProductFetch((prev) =>
      prev.filter((item) => item.vendor_prod_id !== itemId)
    );
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="container-fluid p-3">
        <Form noValidate validated={validated} onSubmit={handleUpdate}>
          <div className="border p-3 shadow-sm rounded">
            <div className="w-100 d-flex flex-row justify-content-between mb-3">
              <h4>
                {" "}
                <Link to="/purchases/vendors" className="text-dark mx-2">
                  <i class="fa-solid fa-arrow-left"></i>
                </Link>
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
            <div className="row mx-auto p-3">
              <div className="col-sm mb-2">
                <label htmlFor="">
                  Company Name
                  <span className="ps-1 text-danger">*</span>
                </label>
                <input
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  required
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
                <label htmlFor="">
                  Email Address
                  <span className="ps-1 text-danger">*</span>
                </label>
                <input
                  type="email"
                  name=""
                  className="form-control"
                  id=""
                  required
                  value={emailAddress}
                  onChange={(e) => setemailAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="row mx-auto p-3">
              <div className="col-12 col-md-8">
                <label htmlFor="">
                  Company Address
                  <span className="ps-1 text-danger">*</span>
                </label>
                <input
                  type="text"
                  name=""
                  required
                  className="form-control"
                  id=""
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="">
                  City
                  <span className="ps-1 text-danger">*</span>
                </label>
                <input
                  type="text"
                  name=""
                  required
                  className="form-control"
                  id=""
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
            <div className="row mx-auto p-3">
              <div className="col-sm">
                <label>
                  Country <span className="text-danger">*</span>
                </label>
                <Select
                  required
                  options={countryOptions}
                  value={countryOptions.find(
                    (option) => option.value === country
                  )}
                  onChange={(selectedOption) => {
                    setCountry(selectedOption ? selectedOption.value : "");
                    setIsCountryInvalid(false); // Reset invalid state when value changes
                  }}
                  placeholder="Select Country"
                  isClearable
                  isSearchable
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: isCountryInvalid
                        ? "#dc3545"
                        : base.borderColor,
                      "&:hover": {
                        borderColor: isCountryInvalid
                          ? "#dc3545"
                          : base.borderColor,
                      },
                      boxShadow: state.isFocused
                        ? isCountryInvalid
                          ? "0 0 0 0.2rem rgba(220, 53, 69, 0.25)"
                          : base.boxShadow
                        : base.boxShadow,
                    }),
                  }}
                />
              </div>
              <div className="col-sm">
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
              <div className="col-sm">
                <span>
                  Currency <span className="text-danger">*</span>
                </span>
                <select
                  required
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
                      {item.currency_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row mx-auto p-3">
              <div className="col-sm mb-2">
                <label>
                  VAT (%) <span className="text-danger">*</span>
                </label>
                <Form.Control
                  required
                  type="text"
                  value={vat}
                  placeholder="Enter VAT"
                  onChange={(e) => {
                    let value = e.target.value;

                    // Allow only digits and at most one decimal point
                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                      // Convert to number and cap at 100
                      const numericValue = parseFloat(value);
                      if (!isNaN(numericValue)) {
                        if (numericValue > 100) {
                          setVat("100");
                        } else {
                          setVat(value);
                        }
                      } else {
                        // Empty or just "." is okay to keep typing
                        setVat(value);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    const allowedKeys = [
                      "Backspace",
                      "Delete",
                      "ArrowLeft",
                      "ArrowRight",
                      "Tab",
                      "Home",
                      "End",
                    ];

                    const isNumber = /[0-9]/.test(e.key);
                    const isDecimal = e.key === ".";

                    if (
                      !isNumber &&
                      !allowedKeys.includes(e.key) &&
                      !(isDecimal && !vat.includes("."))
                    ) {
                      e.preventDefault();
                    }
                  }}
                  maxLength={6} // enough for e.g. 100.00
                />
              </div>
              <div className="col-sm mb-2">
                <label>
                  Status <span className="text-danger">*</span>
                </label>
                <Form.Select
                  id="status"
                  value={status}
                  required
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-select"
                  style={{ cursor: "pointer" }}
                >
                  <option disabled value="">
                    Select Status
                  </option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Form.Select>
              </div>
              <div className="col-sm mb-2"></div>
            </div>
            <div className="w-100 mt-2 d-flex align-items-center">
              <span>Contact Information</span>
              <hr className="flex-grow-1 mx-3" />
            </div>
            <div className="row mx-auto p-3">
              <div className="col-sm mb-2">
                <label htmlFor="">
                  First Name <span className="text-danger">*</span>
                </label>
                <input
                  required
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={fname}
                  onChange={(e) => setFname(e.target.value)}
                />
              </div>
              <div className="col-sm mb-2">
                <label htmlFor="">
                  Last Name <span className="text-danger">*</span>
                </label>
                <input
                  required
                  type="text"
                  name=""
                  className="form-control"
                  id=""
                  value={lname}
                  onChange={(e) => setLname(e.target.value)}
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
                <div>
                  <DatePicker
                    selected={dob}
                    dateFormat="MMM dd, yyyy"
                    onChange={(date) => {
                      setDob(date);
                    }}
                    className="form-control p-2"
                    customInput={<CustomInput />}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    popperPlacement="bottom"
                    popperProps={{
                      strategy: "absolute",
                      postionFixed: "true",
                    }}
                  />
                </div>
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
                      />
                    </div>
                  </div>
                </Form.Group>
              </div>
            </div>
            <div className="row mx-auto p-3">
              <div className="col-sm mb-2">
                <label htmlFor="">Cellphone No.</label>
                <div className="input-group">
                  <span className="input-group-text">+63</span>
                  <input
                    type="text"
                    name=""
                    className="form-control"
                    id=""
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
                <div className="input-group">
                  <span className="input-group-text">+63</span>
                  <input
                    type="text"
                    name=""
                    className="form-control"
                    id=""
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
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="MMMM d, yyyy" // This allows typing like "July 11, 2025"
                  placeholderText="Type or pick a date"
                  isClearable
                  showPopperArrow={false}
                  className="form-control"
                />
              </div> */}
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
        <div className="w-100 mt-4 container-fluid">
          {/* <DataTable
            columns={fetchProductTable}
            data={productFetch}
            customStyles={customStyles}
            pagination
            className="dataTable vendor-container-table scrollable-contents"
          /> */}

          <div className="table-responsive ">
            <table className="table table-bordered ">
              <thead className="table-light">
                <tr>
                  <th className="p-2">Product Code</th>
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Unit of Measurement</th>
                  <th className="p-2">Client Code</th>
                  <th className="p-2">Client Product Name</th>
                  <th
                    className={
                      roleType?.includes("Management") ? "p-2" : "d-none"
                    }
                  >
                    Sell Price
                  </th>
                  <th
                    className={
                      roleType?.includes("Management") ? "p-2" : "d-none"
                    }
                  >
                    Price History
                  </th>
                  <th className="p-2">Status</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {productFetch
                  .filter((data) => data.vendor_prod_status !== "Archive")
                  .map((data) => (
                    <tr
                      key={
                        data.type === "new" ? data.vendor_prod_id : data.prod_id
                      }
                    >
                      <td>{data.prod_code}</td>
                      <td>
                        <select
                          name=""
                          value={data.prod_id || ""}
                          id=""
                          className="form-select"
                          onChange={(e) => {
                            const selectedProductId = e.target.value;

                            const isExit = productFetch.find(
                              (product) =>
                                String(product.prod_id) ===
                                  String(selectedProductId) &&
                                product.prod_id !== data.prod_id // Allow the current item to keep its selection
                            );

                            if (isExit) {
                              swal({
                                title: "Oppss!",
                                text: "You cannot add product already exist",
                                icon: "error",
                                buttons: false,
                                timer: 2000,
                              });
                            } else {
                              const selectedProduct = productData.find(
                                (product) =>
                                  String(product.product_id) ===
                                  String(selectedProductId)
                              );

                              if (selectedProduct) {
                                setProductFetch((prevProductFetch) => {
                                  const updatedFetch = prevProductFetch.map(
                                    (item) =>
                                      item.vendor_prod_id ===
                                      data.vendor_prod_id
                                        ? {
                                            ...item,
                                            prod_id: selectedProduct.product_id,
                                            prod_code:
                                              selectedProduct.product_code,
                                            prod_name:
                                              selectedProduct.product_name,
                                            prod_cat:
                                              selectedProduct.product_category,
                                            prod_uom:
                                              selectedProduct.unit_of_measure,
                                            // Keep vendor values
                                            vendor_prod_id: item.vendor_prod_id,
                                            vendor_prod_price:
                                              item.vendor_prod_price,
                                            vendor_prod_status:
                                              item.vendor_prod_status,
                                            type: item.type,
                                          }
                                        : item
                                  );
                                  return updatedFetch;
                                });
                              }
                            }
                          }}
                          disabled={data.type === "old"}
                        >
                          <option value="" selected disabled>
                            Select Product
                          </option>
                          {productData
                            .filter((product) => {
                              // Filter out products that are already selected by other items
                              const isAlreadySelected = productFetch.some(
                                (fetchedProduct) =>
                                  String(fetchedProduct.prod_id) ===
                                    String(product.product_id) &&
                                  fetchedProduct.prod_id !== data.prod_id // Allow current item to show its own selection
                              );
                              return !isAlreadySelected;
                            })
                            .map((product) => (
                              <option
                                key={product.product_id}
                                value={product.product_id}
                              >
                                {product.product_name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td>{data.prod_cat}</td>
                      <td>{data.prod_uom}</td>
                      <td>
                        <input
                          type="text"
                          value={data.vendor_prod_code}
                          onChange={(e) => {
                            const newCode = e.target.value;
                            setProductFetch((prevProductFetch) =>
                              prevProductFetch.map((item) =>
                                item.prod_id === data.prod_id
                                  ? { ...item, vendor_prod_code: newCode }
                                  : item
                              )
                            );
                          }}
                          className="form-control"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={data.vendor_prod_name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setProductFetch((prevProductFetch) =>
                              prevProductFetch.map((item) =>
                                item.prod_id === data.prod_id
                                  ? { ...item, vendor_prod_name: newName }
                                  : item
                              )
                            );
                          }}
                          className="form-control"
                        />
                      </td>
                      <td
                        className={
                          roleType?.includes("Management") ? "" : "d-none"
                        }
                      >
                        <NumericFormat
                          className="form-control"
                          value={data.vendor_prod_price}
                          thousandSeparator={true}
                          max={9999999999}
                          onValueChange={(values) => {
                            const rawValue = values.floatValue || 0;
                            setProductFetch((prevProductFetch) =>
                              prevProductFetch.map((item) =>
                                item.prod_id === data.prod_id
                                  ? { ...item, vendor_prod_price: rawValue }
                                  : item
                              )
                            );
                          }}
                          isAllowed={(values) => {
                            const { floatValue } = values;
                            return (
                              floatValue === undefined ||
                              (floatValue >= 0 && floatValue <= 9999999999)
                            );
                          }}
                        />
                        {/* <input
                        type="text"
                        maxLength={12}
                        onInput={onInputFloat}
                        value={data.vendor_prod_price}
                        onChange={(e) => {
                          const newPrice = e.target.value;
                          setProductFetch((prevProductFetch) =>
                            prevProductFetch.map((item) =>
                              item.prod_id === data.prod_id
                                ? { ...item, vendor_prod_price: newPrice }
                                : item
                            )
                          );
                        }}
                        className="form-control"
                      /> */}
                      </td>
                      <td
                        className={
                          roleType?.includes("Management")
                            ? "text-center"
                            : "d-none"
                        }
                      >
                        <button
                          className="border-0"
                          style={{ background: "inherit" }}
                          title="Price History"
                          onClick={() =>
                            handleShowHistory(
                              data.prod_id,
                              data.prod_name,
                              data.prod_code,
                              data.vendor_prod_price
                            )
                          }
                        >
                          <i className="fa-solid fa-clipboard-list fs-4 text-primary"></i>
                        </button>
                      </td>
                      <td>
                        <span
                          style={{
                            color:
                              data.vendor_prod_status === "Active"
                                ? "green"
                                : "red",
                            border: `1px solid ${
                              data.vendor_prod_status === "Active"
                                ? "green"
                                : "red"
                            }`,
                            padding: "2px 15px",
                            borderRadius: "12px",
                            display: "inline-block",
                          }}
                        >
                          {data.vendor_prod_status}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn d-flex align-items-center justify-content-center ${
                            data.vendor_prod_status === "Active"
                              ? "btn-outline-danger custom-btn-danger"
                              : "btn-outline-primary custom-btn-primary"
                          }`}
                          onClick={() =>
                            data.type === "new"
                              ? removeNewItem(data.vendor_prod_id)
                              : vendorProductRemove(
                                  data.vendor_prod_id,
                                  data.vendor_prod_status
                                )
                          }
                          style={{
                            cursor: "pointer",
                            fontSize: "16px",
                            background: "none",
                          }}
                        >
                          <i
                            className={`fa-solid ${
                              data.vendor_prod_status === "Active"
                                ? "fa-times fs-5"
                                : "fa-check fs-5"
                            }`}
                          ></i>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
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
                    {vendorPriceHistoryData.length > 0 ? (
                      vendorPriceHistoryData.map((history, index) => (
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
    </div>
  );
};

export default UpdateVendor;
