import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import Select from "react-select";
import { Link, useNavigate } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import { FaCalendarAlt } from "react-icons/fa";

import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";

const Vendors = ({ authrztn }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();

  // fetch
  const [companyName, setcompanyName] = useState("");
  const [companyNature, setcompanyNature] = useState(null);
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
  const [gender, setGender] = useState("Male");
  const [contactNo, setContactNo] = useState("");
  const [contactNo2, setContactNo2] = useState("");
  const [tin, setTin] = useState("");
  const [position, setPosition] = useState("");
  const [selectedID, setSelectedID] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDesignation, setFilterDesignation] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [vat, setVat] = useState("");
  const [isCountryInvalid, setIsCountryInvalid] = useState(false);

  // validation
  const [validated, setValidated] = useState(false);

  // clear filter
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  // update show modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // add show modal
  const [showModal, setShowModal] = useState(false);
  const handleShow = () => {
    setShowModal(true);
    fetchCountries(); // Fetch countries when modal is shown
  };
  const [currency, setCurrency] = useState([]);
  const [currencyID, setCurrencyID] = useState("");
  const reloadCurrency = () => {
    axios.get(BASE_URL + "/currency/fetchCurrency").then((res) => {
      setCurrency(res.data);
    });
  };
  const handleClose = () => {
    setShowModal(false);
    setShowUpdateModal(false);
    setcompanyName("");
    setcompanyNature("");
    setemailAddress("");
    setCompanyAddress("");
    setCity("");
    setCountry("");
    setDesignation("");
    setFname("");
    setLname("");
    setMname("");
    setCivilStatus("");
    setDob("");
    setGender("");
    setContactNo("");
    setContactNo2("");
    setTin("");
    setPosition("");
    setVat("");
    setValidated(false);
    setIsCountryInvalid(false);

    // Reset contactPersons to its initial state
    setContactPersons([
      {
        fname: "",
        lname: "",
        mname: "",
        civilStatus: "",
        dob: "",
        gender: "",
        contactNo: "",
        tin: "",
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const isCountryValid = country !== "";
    setIsCountryInvalid(!isCountryValid);
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
        title: "Create this new vendor?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          try {
            axios
              .post(BASE_URL + "/vendors/addVendors", {
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
                currencyID,
                vat,
                userLoggedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    title: "Success!",
                    text: "Vendors successfully added.",
                    icon: "success",
                    buttons: false,
                    timer: 2000,
                  });

                  handleClose();
                  reloadTable();
                } else if (res.status === 201) {
                  swal({
                    title: "Already Exist!",
                    text: "Vendors duplicated, unable to insert.",
                    icon: "warning",
                    buttons: false,
                    timer: 2000,
                  });
                }
              });
          } catch (error) {
            console.error("Error adding Vendors:", error);
            swal({
              title: "Error!",
              text: "There was an error adding the Vendors.",
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

  // update
  const handleUpdateShow = (data) => {
    setShowUpdateModal(true);
    setSelectedID(data.id);
    setcompanyName(data.company_name);
    setcompanyNature(data.company_nature);
    setemailAddress(data.company_email);
    setCompanyAddress(data.company_address);
    setCity(data.company_city);
    setCountry(data.company_country);
    setDesignation(data.company_designation);
    setFname(data.fname);
    setLname(data.fname);
    setMname(data.lname);
    setCivilStatus(data.civil_status);
    setDob(data.dob);
    setGender(data.gender);
    setContactNo(data.contact);
    setTin(data.tin_number);
    setPosition(data.position);
  };

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
                tin,
                position,
                selectedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    title: "Success!",
                    text: "Vendors successfully updated.",
                    icon: "success",
                    buttons: false,
                    timer: 2000,
                  });

                  handleClose();
                  reloadTable();
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

  // add another contact person
  const [contactPersons, setContactPersons] = useState([
    {
      fname: "",
      lname: "",
      mname: "",
      civilStatus: "",
      dob: "",
      gender: "",
      contactNo: "",
      contactNo2a: "",
      tin: "",
    },
  ]);

  const addContactPerson = () => {
    setContactPersons([
      ...contactPersons,
      {
        fname: "",
        lname: "",
        mname: "",
        civilStatus: "",
        dob: "",
        gender: "",
        contactNo: "",
        tin: "",
      },
    ]);
  };

  const removeContactPerson = (index) => {
    const newContactPersons = contactPersons.filter((_, i) => i !== index);
    setContactPersons(newContactPersons);
  };

  // Fetch data
  const [showData, setShowData] = useState([]);

  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/vendors/fetchPaginatedVendors"
  );

  const pagination = useServerPagination(paginationUrl, 10);
  // fetch
  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/vendors/fetchPaginatedVendors");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/vendors/filterSearchVendors");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all",
        filterCurrency,
        filterStatus,
        filterDesignation,
      });
    }
  };

  const reloadTable = () => {
    pagination.updateParams({
      searchText,
      filterColumn: filterColumn || "all",
      filterCurrency,
      filterStatus,
      filterDesignation,
    });
    setIsLoading(false);
  };

  //   const reloadTable = () => {
  //     pagination.updateParams({
  //       filterStatus,
  //       filterDesignation,
  //       filterColumn,
  //       searchText,
  //     });
  //     setIsLoading(false);
  //     // axios
  //     //   .get(BASE_URL + "/vendors/filterSearchVendors", {
  //     //     params: {
  //     //       filterStatus,
  //     //       filterDesignation,
  //     //       filterColumn,
  //     //       searchText,
  //     //     },
  //     //   })
  //     //   .then((res) => {
  //     //     setShowData(res.data);
  //     //     setIsLoading(false);
  //     //   });
  //   };

  useEffect(() => {
    setShowData(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCountries();
      reloadCurrency();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    reloadTable();
  }, [searchText]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  const filteredItems = showData?.filter((item) => {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();
    const contactPerson = `${item.fname} ${item.lname}`.toLowerCase(); // Concatenate and convert to lower case

    switch (filterColumn) {
      case "company_name":
        return item.company_name.toLowerCase().includes(searchLower);
      case "company_nature":
        return item.company_nature.toLowerCase().includes(searchLower);
      case "company_email":
        return item.company_email.toLowerCase().includes(searchLower);
      case "company_city":
        return item.company_city.toLowerCase().includes(searchLower);
      case "company_country":
        return item.company_country.toLowerCase().includes(searchLower);
      case "company_designation":
        return item.company_designation.toLowerCase().includes(searchLower);
      case "Contact":
        return item.contact.toString().toLowerCase().includes(searchLower);
      case "status":
        return item.status.toLowerCase().includes(searchLower);
      case "contact_person":
        return contactPerson.includes(searchLower); // Add contact person filter
      default:
        return (
          item.company_name.toLowerCase().includes(searchLower) ||
          item.company_nature.toLowerCase().includes(searchLower) ||
          item.company_email.toLowerCase().includes(searchLower) ||
          item.company_city.toLowerCase().includes(searchLower) ||
          item.company_country.toLowerCase().includes(searchLower) ||
          item.company_designation.toLowerCase().includes(searchLower) ||
          item.contact.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower) ||
          contactPerson.includes(searchLower) // Add contact person to default filter
        );
    }
  });

  const applyFilter = () => {
    setPaginationUrl(BASE_URL + "/vendors/filterSearchVendors");
    reloadTable();
  };

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
    setFilterCurrency("");
    setFilterDesignation("");
    setFilterStatus("");
    setPaginationUrl(BASE_URL + "/vendors/fetchPaginatedVendors");
    pagination.updateParams({});
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick, isInvalid }, ref) => (
    <div className="position-relative">
      <input
        type="text"
        className={`form-control w-100 ${
          isInvalid ? "is-invalid border-danger" : ""
        }`}
        style={{
          cursor: "pointer",
          backgroundImage: "none",
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
          zIndex: 2,
        }}
      >
        <FaCalendarAlt />
      </span>
    </div>
  ));

  return (
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
      ) : authrztn.includes("Vendors-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">VENDORS</span>
            </div>

            <div>
              {authrztn.includes("Vendors-Add") && (
                <button
                  className="btn btn-primary d-flex align-items-center title-button"
                  onClick={handleShow}
                >
                  <i className="bx bx-plus fs-5"></i> Add Vendor
                </button>
              )}
            </div>
          </div>
          <div className="w-100 row align-items-end mt-4 mx-auto">
            <div className="col-md-3 mb-2">
              <span>Business Status</span>
              <select
                name="status"
                id="status"
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="" selected disabled>
                  Select Status
                </option>
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <span>Business Currency</span>
              <select
                name=""
                id=""
                className="form-select"
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
              >
                <option value="" selected disabled>
                  Select Currency
                </option>
                {currency.map((item, index) => (
                  <option key={index} value={item.currency_name}>
                    {item.currency_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <span>Business Designation</span>
              <select
                name=""
                id=""
                className="form-select"
                value={filterDesignation}
                onChange={(e) => setFilterDesignation(e.target.value)}
              >
                <option value="" selected disabled>
                  Select Designation
                </option>
                <option value="All">All</option>
                <option value="Local">Local</option>
                <option value="Overseas">Overseas</option>
              </select>
            </div>
            <div className="col-md-3 mb-2 d-flex gap-2 h-100 align-items-end">
              <button
                type="button"
                className="btn btn-dark flex-grow-1"
                onClick={applyFilter}
                style={{ whiteSpace: "nowrap" }}
              >
                Apply Filter
              </button>
              <button
                className="btn btn-light border flex-grow-1"
                onClick={clearFilter}
                style={{ whiteSpace: "nowrap" }}
              >
                Clear Filter
              </button>
            </div>

            <div className="col-sm mb-2">
              {/* <span>Currency</span>
          <select
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
          </select> */}
            </div>
            <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container"></div>
            <div className="col-sm"></div>
          </div>
          <div className="w-100 mt-2 container-fluid">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary dropdown-toggle-split"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fa-solid fa-sliders"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "all" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("all")}
                  >
                    All
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_name" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_name")}
                  >
                    Company Name
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_nature" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_nature")}
                  >
                    Company Nature
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_email" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_email")}
                  >
                    Company Email
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_designation" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_designation")}
                  >
                    Designation
                  </button>
                </li>
                {/* <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_city" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_city")}
                  >
                    City
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "company_country" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("company_country")}
                  >
                    Country
                  </button>
                </li> */}
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "currency" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("currency")}
                  >
                    Currency
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "contact_person" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("contact_person")}
                  >
                    Contact Person
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "contact" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("contact")}
                  >
                    Contact Number
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="w-100 mt-3 container-fluid">
            {/* <DataTable
              columns={columns}
              data={showData}
              customStyles={customStyles}
              onRowClicked={(row) =>
                navigate(`../purchases/vendor-update/${row.id}`)
              }
              className="dataTable"
            /> */}
            <div className="table-responsive data-table scrollable-contents">
              <table className="table table-hover table-responsive">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      COMPANY NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      NATURE
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      COMPANY EMAIL
                      <i className="fas fa-sort ms-1"></i>
                    </th>

                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      DESIGNATION
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      CURRENCY
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      CONTACT PERSON
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      CONTACT
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted text-center"
                      style={{
                        backgroundColor: "#EBEFF4",
                        cursor: "pointer",
                        padding: "0.3rem 0.5rem",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      STATUS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.error ? (
                    <tr>
                      <td className="text-center text-danger py-4">
                        <div className="d-flex flex-column align-items-center">
                          <i className="fas fa-exclamation-triangle fs-4 mb-2"></i>
                          <span>Error loading data</span>
                          <small className="text-muted mt-1">
                            {pagination.error.message}
                          </small>
                        </div>
                      </td>
                    </tr>
                  ) : pagination.data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <span>No data available</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          console.log(item.id);
                          navigate(`../purchases/vendor-update/${item.id}`);
                        }}
                      >
                        <td className="text-center">
                          {item.company_name ?? "---"}
                        </td>
                        <td className="text-center">
                          {item.company_nature ?? "---"}
                        </td>
                        <td className="text-center">
                          {item.company_email ?? "---"}
                        </td>
                        <td className="text-center">
                          {item.company_designation}
                        </td>
                        <td className="text-center">
                          {item.currency.currency_name}
                        </td>
                        <td className="text-center">{`${item.fname} ${item.lname}`}</td>
                        <td className="text-center">{item.contact}</td>
                        <td
                          className="text-center"
                          style={{
                            padding: "5px, 10px",
                            borderRadius: "5px",
                            color: item.status
                              ? item.status === "Active"
                                ? "#3B9F3F"
                                : "#FFA500"
                              : "initial",
                            textTransform: "uppercase",
                            fontWeight: "bold",
                          }}
                        >
                          {item.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls {...pagination} />
          </div>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}

      {/* add vendor */}
      <Modal show={showModal} onHide={handleClose} size="xl" backdrop="static">
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Create Vendor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <div className="w-100 container-fluid">
              <div className="w-100 d-flex align-items-center">
                <span>General Information</span>
                <hr className="flex-grow-1 mx-3" />
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="companyName">
                    <Form.Label>
                      Company Name
                      <span className="ps-1 text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      value={companyName}
                      placeholder="Enter Name"
                      onChange={(e) => setcompanyName(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="companyNature">
                    <Form.Label>Company Nature</Form.Label>
                    <Form.Control
                      type="text"
                      value={companyNature}
                      placeholder="Enter Nature"
                      onChange={(e) => setcompanyNature(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="emailAddress">
                    <Form.Label>
                      Email Address
                      <span className="ps-1 text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="email"
                      required
                      value={emailAddress}
                      placeholder="Enter Email"
                      onChange={(e) => setemailAddress(e.target.value)}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-12 col-md-8">
                  <Form.Group className="mb-3" controlId="companyAddress">
                    <Form.Label>
                      Company Address
                      <span className="ps-1 text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      value={companyAddress}
                      placeholder="Enter Address"
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3" controlId="city">
                    <Form.Label>
                      City
                      <span className="ps-1 text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      required
                      type="text"
                      value={city}
                      placeholder="Enter City"
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm">
                  <Form.Group controlId="country">
                    <Form.Label>
                      Country <span className="text-danger">*</span>
                    </Form.Label>
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
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="designation">
                    <Form.Label>
                      Designation <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={designation}
                      required
                      onChange={(e) => setDesignation(e.target.value)}
                    >
                      <option value="" disabled>
                        Select Designation
                      </option>
                      <option value="Local">Local</option>
                      <option value="Overseas">Overseas</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="designation">
                    <Form.Label>
                      Currency <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      required
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
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm mb-2">
                  <Form.Group controlId="vat">
                    <Form.Label>
                      VAT (%) <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={vat}
                      placeholder="Enter VAT"
                      required
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
                  </Form.Group>
                </div>
                <div className="col-sm mb-2"></div>
                <div className="col-sm mb-2"></div>
              </div>

              <div className="w-100">
                <div className="w-100 mt-2 d-flex align-items-center">
                  <span>Contact Information</span>
                  <hr className="flex-grow-1 mx-3" />
                  {/* <Button variant="outline-primary" onClick={addContactPerson}>
                    <i className="fas fa-plus"></i>
                  </Button> */}
                </div>
                {/* {contactPersons.map((person, index) => ( */}
                <div className="border p-3 mb-3 position-relative">
                  {/* {index > 0 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="position-absolute top-0 end-0 m-2"
                        onClick={() => removeContactPerson(index)}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    )} */}
                  <div className="row w-100 mt-3">
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`firstName`}>
                        <Form.Label>
                          First Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter First Name"
                          value={fname}
                          onChange={(e) => {
                            // const newContactPersons = [...contactPersons];
                            // newContactPersons[index].fname = e.target.value;
                            // setContactPersons(newContactPersons);
                            setFname(e.target.value);
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`lastName`}>
                        <Form.Label>
                          Last Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          value={lname}
                          placeholder="Enter Last Name"
                          onChange={(e) => {
                            // const newContactPersons = [...contactPersons];
                            // newContactPersons[index].lname = e.target.value;
                            // setContactPersons(newContactPersons);
                            setLname(e.target.value);
                          }}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`middleName`}>
                        <Form.Label>Middle Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter Middle Name"
                          value={mname}
                          onChange={(e) => {
                            // const newContactPersons = [...contactPersons];
                            // newContactPersons[index].mname = e.target.value;
                            // setContactPersons(newContactPersons);
                            setMname(e.target.value);
                          }}
                        />
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row w-100 mt-3">
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`civilStatus`}>
                        <Form.Label>Civil Status</Form.Label>
                        <Form.Select
                          value={civilStatus}
                          onChange={(e) => {
                            setCivilStatus(e.target.value);
                          }}
                        >
                          <option value="" disabled>
                            Select Civil Status
                          </option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`dob`}>
                        <Form.Label>Date of Birth</Form.Label>
                        {/* <Form.Control
                          type="date"
                          value={dob}
                          onChange={(e) => {
                            // const newContactPersons = [...contactPersons];
                            // newContactPersons[index].dob = e.target.value;
                            // setContactPersons(newContactPersons);
                            setDob(e.target.value);
                          }}
                        /> */}
                        <div>
                          <DatePicker
                            selected={dob}
                            dateFormat="MM/dd/yyyy"
                            onChange={(date) => setDob(date)}
                            className="form-control p-2"
                            customInput={<CustomInput />}
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            popperPlacement="bottom"
                            popperProps={{
                              positionFixed: true,
                            }}
                          />
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId={`gender`}>
                        <Form.Label>Choose Gender</Form.Label>
                        <div className="row">
                          <div className="col-sm mb-1">
                            <Form.Check
                              type="radio"
                              name={`gender`}
                              id={`male`}
                              label="Male"
                              value="Male"
                              checked={gender === "Male"}
                              onChange={(e) => {
                                // const newContactPersons = [...contactPersons];
                                // newContactPersons[index].gender =
                                //   e.target.value;
                                // setContactPersons(newContactPersons);
                                setGender("Male");
                              }}
                            />
                          </div>
                          <div className="col-sm mb-1">
                            <Form.Check
                              type="radio"
                              name={`gender`}
                              id={`female`}
                              label="Female"
                              value="Female"
                              checked={gender === "Female"}
                              onChange={(e) => {
                                // const newContactPersons = [...contactPersons];
                                // newContactPersons[index].gender =
                                //   e.target.value;
                                // setContactPersons(newContactPersons);
                                setGender("Female");
                              }}
                            />
                          </div>
                        </div>
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row w-100 mt-3">
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>Cellphone No.</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <Form.Control
                            type="text"
                            placeholder="Enter Cellphone Number"
                            value={contactNo}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => setContactNo(e.target.value)}
                            maxLength={10}
                          />
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>Additional Contact No.</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <Form.Control
                            type="text"
                            placeholder="Enter Contact Number"
                            value={contactNo2}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => setContactNo2(e.target.value)}
                            maxLength={10}
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
                          placeholder="Enter TIN Number"
                          maxLength={15}
                          onChange={(e) => {
                            // const newContactPersons = [...contactPersons];
                            // newContactPersons[index].tin = e.target.value;
                            // setContactPersons(newContactPersons);
                            setTin(e.target.value);
                          }}
                        />
                      </Form.Group>
                    </div>
                  </div>
                </div>
                {/* ))} */}
              </div>
            </div>
            <Modal.Footer className="border-0">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* update modal */}
      {/* <Modal
        show={showUpdateModal}
        onHide={handleClose}
        size="xl"
        backdrop="static"
      >
        <Modal.Header className="border-0">
          <Modal.Title>Update Vendor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            noValidate
            validated={validated}
            onSubmit={handleUpdate}
            className="vendor-container scrollable-contents"
          >
            <div className="w-100 container-fluid">
              <div className="w-100 d-flex align-items-center">
                <span>General Information</span>
                <hr className="flex-grow-1 mx-3" />
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="companyName">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={companyName}
                      required
                      placeholder="Enter Name"
                      onChange={(e) => setcompanyName(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="companyNature">
                    <Form.Label>Company Nature</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={companyNature}
                      placeholder="Enter Nature"
                      onChange={(e) => setcompanyNature(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="emailAddress">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={emailAddress}
                      placeholder="Enter Email"
                      onChange={(e) => setemailAddress(e.target.value)}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-12 col-md-8">
                  <Form.Group className="mb-3" controlId="companyAddress">
                    <Form.Label>Company Address</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={companyAddress}
                      placeholder="Enter Address"
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3" controlId="city">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={city}
                      placeholder="Enter City"
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm mb-2">
                  <Form.Group controlId="country">
                    <Form.Label>Country</Form.Label>
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
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="designation">
                    <Form.Label>Designation</Form.Label>
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
                <div className="col-sm"></div>
              </div>

              <div className="w-100">
                <div className="w-100 mt-2 d-flex align-items-center">
                  <span>Contact Information</span>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="row w-100 mt-3">
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="firstName">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        placeholder="Enter First Name"
                        value={fname}
                        onChange={(e) => setFname(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="lastName">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        value={lname}
                        placeholder="Enter Last Name"
                        onChange={(e) => setLname(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="middleName">
                      <Form.Label>Middle Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter Middle Name"
                        value={mname}
                        onChange={(e) => setMname(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                </div>
                <div className="row w-100 mt-3">
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="civilStatus">
                      <Form.Label>Civil Status</Form.Label>
                      <Form.Select
                        required
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
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="lastName">
                      <Form.Label>Date of Birth</Form.Label>
                      <Form.Control
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
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
                <div className="row w-100 mt-3">
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="mobileNumber">
                      <Form.Label>Contact No.</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        placeholder="Enter Contact Number"
                        value={contactNo}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            setContactNo(value);
                          }
                        }}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="tinNumber">
                      <Form.Label>TIN</Form.Label>
                      <Form.Control
                        type="text"
                        value={tin}
                        placeholder="Enter TIN Number"
                        onChange={(e) => setTin(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="jobPosition">
                      <Form.Label>Job Position</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        placeholder="Enter Position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>
            <Modal.Footer className="border-0">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal> */}
    </div>
  );
};

export default Vendors;
