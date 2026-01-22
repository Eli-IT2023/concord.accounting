import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
// import DatePicker from "react-datepicker";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { ArrowsClockwise } from "@phosphor-icons/react";
import CustomDatePicker from "../../components/CustomDatePicker";

const Vendors = ({ authrztn }) => {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  // const yearRef = useRef();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // fetch
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
  const [dob, setDob] = useState(yesterday);
  const [gender, setGender] = useState("Male");
  const [contactNo, setContactNo] = useState("");
  const [contactNo2, setContactNo2] = useState("");
  const [tin, setTin] = useState("");
  const [position, setPosition] = useState("");
  // const [selectedID, setSelectedID] = useState("");
  const [filterStatus, setFilterStatus] = useState("Active");
  const [filterDesignation, setFilterDesignation] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  // const [deletionTrigger, setDeletionTrigger] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState([]);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [changeToStatus, setChangeToStatus] = useState("");
  const [tagAllProduct, setTagAllProduct] = useState(false);
  const [supplierCode, setSupplierCode] = useState("");

  // validation
  const [validated, setValidated] = useState(false);

  // clear filter
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  // update show modal
  // const [showUpdateModal, setShowUpdateModal] = useState(false);

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

  // const [selectYear, setSelectYear] = useState(false);
  // const [yearList, setYearList] = useState([]);

  // function range(start, end, step = 1) {
  //   const result = [];
  //   for (let i = start; i < end; i += step) {
  //     result.push(i);
  //   }
  //   return result;
  // }

  // const years = range(1900, new Date().getFullYear() + 1, 1);
  // const months = [
  //   "January",
  //   "February",
  //   "March",
  //   "April",
  //   "May",
  //   "June",
  //   "July",
  //   "August",
  //   "September",
  //   "October",
  //   "November",
  //   "December",
  // ];

  // const generateYears = (year) => {
  //   setYearList(() => {
  //     const updated = [];
  //     const currentYear = new Date().getFullYear();

  //     // Generate years based on current year or selected year
  //     const yearList = Array.from(
  //       { length: 16 },
  //       (_, i) => (year ? year : currentYear) - 16 + i + 1
  //     );

  //     // Divide array by 4 items
  //     for (let i = 0; i < yearList.length; i += 4) {
  //       updated.push(yearList.slice(i, i + 4));
  //     }

  //     return updated;
  //   });
  // };

  // const increaseYear = (changeYear) => {
  //   setYearList((prev) => {
  //     const updated = prev.map((item) => item.map((year) => year + 10));
  //     changeYear(updated[3][3]);

  //     return updated;
  //   });
  // };

  // const decreaseYear = (changeYear) => {
  //   setYearList((prev) => {
  //     const updated = prev.map((item) => item.map((year) => year - 10));
  //     changeYear(updated[3][3]);

  //     return updated;
  //   });
  // };

  const handleDateChange = (date) => {
    // const newContactPersons = [...contactPersons];
    // newContactPersons[index].dob = e.target.value;
    // setContactPersons(newContactPersons);
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

  // const handleResetToToday = (changeYear, changeMonth) => {
  //   const currentYear = new Date().getFullYear();

  //   setDob(new Date());

  //   generateYears(); // Reset Year List

  //   changeYear(currentYear); // Set year

  //   changeMonth(
  //     months.indexOf(
  //       months[new Date().getMonth()] // Set month
  //     )
  //   );
  // };

  const handleClose = () => {
    setShowModal(false);
    // setShowUpdateModal(false);
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
    setDob(new Date());
    setGender("");
    setContactNo("");
    setContactNo2("");
    setTin("");
    setPosition("");
    setSupplierCode("");
    setValidated(false);

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

    // Validate form fields
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
      setValidated(true);
      return;
    }

    swal({
      title: "Create this new vendor?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (confirmed) => {
      if (confirmed) {
        try {
          const res = await axios.post(BASE_URL + "/vendors/addVendors", {
            tagAllProduct,
            companyName: companyName.trim(),
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
            supplierCode,
            userLoggedID,
          });

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
  };

  // update
  // const handleUpdateShow = (data) => {
  //   setShowUpdateModal(true);
  //   setSelectedID(data.id);
  //   setcompanyName(data.company_name);
  //   setcompanyNature(data.company_nature);
  //   setemailAddress(data.company_email);
  //   setCompanyAddress(data.company_address);
  //   setCity(data.company_city);
  //   setCountry(data.company_country);
  //   setDesignation(data.company_designation);
  //   setFname(data.fname);
  //   setLname(data.fname);
  //   setMname(data.lname);
  //   setCivilStatus(data.civil_status);
  //   setDob(data.dob);
  //   setGender(data.gender);
  //   setContactNo(data.contact);
  //   setTin(data.tin_number);
  //   setPosition(data.position);
  // };

  // const handleUpdate = async (e) => {
  //   e.preventDefault();
  //   const form = e.currentTarget;
  //   if (form.checkValidity() === false) {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     swal({
  //       icon: "error",
  //       title: "Fields are required",
  //       text: "Please fill in the red text fields.",
  //       buttons: false,
  //       timer: 2000,
  //     });
  //   } else {
  //     swal({
  //       title: "Update this vendors?",
  //       text: "",
  //       icon: "warning",
  //       buttons: true,
  //       dangerMode: true,
  //     }).then((confirmed) => {
  //       if (confirmed) {
  //         try {
  //           axios
  //             .post(BASE_URL + "/vendors/updateVendors", {
  //               companyName,
  //               companyNature,
  //               emailAddress,
  //               companyAddress,
  //               city,
  //               country,
  //               designation,
  //               fname,
  //               mname,
  //               lname,
  //               civilStatus,
  //               dob,
  //               gender,
  //               contactNo,
  //               tin,
  //               position,
  //               selectedID,
  //             })
  //             .then((res) => {
  //               if (res.status === 200) {
  //                 swal({
  //                   title: "Success!",
  //                   text: "Vendors successfully updated.",
  //                   icon: "success",
  //                   buttons: false,
  //                   timer: 2000,
  //                 });

  //                 handleClose();
  //                 reloadTable();
  //               } else if (res.status === 201) {
  //                 swal({
  //                   title: "Already Exist!",
  //                   text: "Vendors duplicated, unable to update.",
  //                   icon: "warning",
  //                   buttons: false,
  //                   timer: 2000,
  //                 });
  //               }
  //             });
  //         } catch (error) {
  //           console.error("Error updating Vendors:", error);
  //           swal({
  //             title: "Error!",
  //             text: "There was an error updating the vendors.",
  //             icon: "error",
  //             buttons: false,
  //             timer: 2000,
  //           });
  //         }
  //       }
  //     });
  //   }
  //   setValidated(true);
  // };

  const handleDeleteVendor = async (id) => {
    try {
      swal({
        icon: "warning",
        title: "Confirm Deletion",
        text: "Are you sure you want to delete?",
        buttons: ["Cancel", "OK"],
        dangerMode: true,
      })
        .then(async (confirmed) => {
          if (confirmed) {
            const res = await axios.put(
              `${BASE_URL}/vendors/deleteVendor/${id}`
            );

            if (res.status === 200) {
              swal({
                icon: "success",
                title: "Vendor Successfully Deleted",
                text: "The Vendor has been successfully deleted",
              }).then(() => {
                reloadTable();
                // setDeletionTrigger(true);
              });
            }
          }
        })
        .catch((error) => {
          console.error(error);

          if (error.response && error.response.status === 409) {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = `
              <span style="color: rgba(0, 0, 0, 0.65)">
                Delete first the purchase order in module <strong>Create Purchase</strong> with Transaction
                Number: <strong>${error.response.data.transaction_id}</strong>
              </span>
            `;
            swal({
              icon: "error",
              title: "Deletion Prohibited",
              content: wrapper,
            });
            return;
          }

          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "error",
            timer: 2000,
          });
        });
    } catch (error) {
      console.error(error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
        timer: 2000,
      });
    }
  };

  const handleChangeStatus = () => {
    try {
      if (changeToStatus === "") {
        swal({
          icon: "warning",
          title: "Warning",
          text: "Please select status before proceeding.",
        });
        return;
      }

      swal({
        icon: "warning",
        title: "Are you sure?",
        text: "You are about to change the status of selected items.",
      })
        .then(async (confirm) => {
          if (confirm) {
            const res = await axios.put(
              `${BASE_URL}/vendors/vendorChangeStatus`,
              {
                selectedVendor: [...new Set(selectedVendor)],
                changeToStatus,
              }
            );

            if (res.status === 200) {
              swal({
                icon: "success",
                title: "Statuses Updated",
                text: "All selected items have been updated",
              }).then(() => {
                setSelectedVendor([]);
                setChangeToStatus("");
                setShowChangeStatusModal(false);
                reloadTable();
              });
            }
          }
        })
        .catch((error) => {
          console.error(error);
          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "error",
            timer: 2000,
          });
        });
    } catch (error) {
      console.error(error);
    }
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

      console.log("Countries:", countries);
      setCountryOptions(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
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

  // const addContactPerson = () => {
  //   setContactPersons([
  //     ...contactPersons,
  //     {
  //       fname: "",
  //       lname: "",
  //       mname: "",
  //       civilStatus: "",
  //       dob: "",
  //       gender: "",
  //       contactNo: "",
  //       tin: "",
  //     },
  //   ]);
  // };

  // const removeContactPerson = (index) => {
  //   const newContactPersons = contactPersons.filter((_, i) => i !== index);
  //   setContactPersons(newContactPersons);
  // };

  // Fetch data
  // const [showData, setShowData] = useState([]);

  const pagination = useServerPagination("about:blank", 10);
  // fetch
  const reloadTable = () => {
    pagination.updateApiUrl(BASE_URL + "/vendors/getVendorsData");
    pagination.updateParams({
      filterStatus,
      filterDesignation,
      filterColumn,
      searchText,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/vendors/filterSearchVendors", {
    //     params: {
    //       filterStatus,
    //       filterDesignation,
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     setShowData(res.data);
    //     setIsLoading(false);
    //   });
  };

  useEffect(() => {
    fetchCountries();
    reloadCurrency();
    reloadTable();

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterStatusChange = (e) => {
    const value = e.target.value;
    setFilterStatus(value);
    pagination.updateApiUrl(BASE_URL + "/vendors/getVendorsData-filter");
    pagination.updateParams({
      filterStatus: value,
      filterDesignation,
    });
  };

  const handleFilterDesignationChange = (e) => {
    const value = e.target.value;
    setFilterDesignation(value);
    pagination.updateApiUrl(BASE_URL + "/vendors/getVendorsData-filter");
    pagination.updateParams({
      filterStatus,
      filterDesignation: value,
    });
  };
  const debounceTimer = useRef(null);
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(async () => {
      pagination.updateApiUrl(BASE_URL + "/vendors/getVendorsData-search");
      pagination.updateParams({
        filterStatus,
        filterDesignation,
        filterColumn,
        searchText: value,
      });
    }, 600);

    // Cleanup timer on unmount or searchTermFilter change
    return () => clearTimeout(debounceTimer.current);
  };

  // useEffect(() => {
  //   setShowData(pagination.data);

  //   if (
  //     deletionTrigger &&
  //     pagination.data.length === 0 &&
  //     pagination.currentPage > 1
  //   ) {
  //     pagination.setCurrentPage(pagination.currentPage - 1);
  //   }
  // }, [pagination.data]);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchCountries();
  //     reloadCurrency();
  //   }, 1000);

  //   return () => clearTimeout(timer);
  // }, []);

  // useEffect(() => {
  //   reloadTable();
  // }, [searchText, filterStatus, filterDesignation]);

  // useEffect(() => {
  //   setSearchText("");
  // }, [filterColumn]);

  // useEffect(() => {
  //   function handleClickOutside(event) {
  //     if (yearRef.current && !yearRef.current.contains(event.target)) {
  //       setSelectYear(false);
  //     }
  //   }

  //   document.addEventListener("mousedown", handleClickOutside);

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  const columns = [
    {
      name: (
        <input
          type="checkbox"
          checked={pagination.data
            .map((item) => item.id)
            .every((item) => selectedVendor.includes(item))} // Checkbox is checked if all items on the current page exist in selectedVendor
          onChange={(e) => {
            return e.target.checked
              ? // Add all items on the current page
                setSelectedVendor((prev) => [
                  ...prev,
                  ...pagination.data.map((item) => item.id),
                ])
              : // Remove currently visible items (on this page) from the selectedVendor list
                // Keeps only the selected items from other pages
                setSelectedVendor((prev) =>
                  prev.filter(
                    (vendorId) =>
                      !pagination.data.map((item) => item.id).includes(vendorId)
                  )
                );
          }}
        />
      ),
      selector: (row) => (
        <input
          type="checkbox"
          checked={selectedVendor.includes(row.id)} // Checkbox is checked if the id of vendor exist in selectedVendor
          onChange={(e) => {
            setSelectedVendor((prev) =>
              e.target.checked
                ? [...prev, row.id]
                : prev.filter((item) => item !== row.id)
            );
          }}
        />
      ),
      width: "8rem",
    },
    {
      name: "Company Name",
      selector: (row) => row.company_name || "--",
    },
    {
      name: "Nature",
      selector: (row) => row.company_nature || "--",
    },
    {
      name: "Company Email",
      selector: (row) => row.company_email || "--",
    },
    {
      name: "Supplier Code",
      selector: (row) => row.supplier_code || "--",
    },
    {
      name: "City",
      selector: (row) => row.company_city || "--",
    },
    {
      name: "Country",
      selector: (row) => row.company_country || "--",
    },
    {
      name: "Designated",
      selector: (row) => row.company_designation,
    },
    {
      name: "Currency",
      selector: (row) => row.currency.currency_name,
    },
    {
      name: "Contact Person",
      selector: (row) =>
        !row.fname || !row.lname ? "--" : `${row.fname} ${row.lname}`,
    },
    {
      name: "Contact",
      selector: (row) => row.contact || "--",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => (
        <div
          style={{
            padding: "5px, 10px",
            borderRadius: "5px",
            color: row.status
              ? row.status === "Active"
                ? "#3B9F3F"
                : "red"
              : "initial",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          {row.status}
        </div>
      ),
    },
    {
      name: "Action",
      selector: (row) => (
        <i
          className="fas fa-trash text-center"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() => handleDeleteVendor(row.id)}
        ></i>
      ),
    },
  ];

  const uniqueSelectedVendor = [...new Set(selectedVendor)];

  const handleBulkDeleteVendor = () => {
    try {
      swal({
        icon: "warning",
        title: "Are you sure?",
        text: "Are you sure you want to delete?",
        buttons: ["Cancel", "OK"],
        dangerMode: true,
      })
        .then(async (confirm) => {
          if (confirm) {
            const res = await axios.put(
              `${BASE_URL}/vendors/vendorBulkSoftDelete`,
              {
                selectedVendor: [...new Set(selectedVendor)],
              }
            );

            if (res.status === 200) {
              swal({
                icon: "success",
                title: "Vendors Deleted",
                text: res.data.message,
              }).then(() => {
                setSelectedVendor([]);
                reloadTable();
              });
              return;
            }
          }
        })
        .catch((error) => {
          if (error.response && error.response.status === 409) {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = `<span style="color: rgba(0, 0, 0, 0.65)">
            Company name <strong>${error.response.data.company_name}</strong> has an existing transaction. 
            Delete first the Purchase order in module <strong>Create Purchase</strong> with Transaction
                Number: <strong>${error.response.data.transaction_id}</strong>
            </span>`;
            swal({
              icon: "error",
              title: "Deletion Prohibited",
              content: wrapper,
            });
            return;
          }
          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "error",
            timer: 2000,
          });
        });
    } catch (error) {
      console.error(error);
    }
  };

  // const filteredItems = showData?.filter((item) => {
  //   if (!searchText) return true;

  //   const searchLower = searchText.toLowerCase();
  //   const contactPerson = `${item.fname} ${item.lname}`.toLowerCase(); // Concatenate and convert to lower case

  //   switch (filterColumn) {
  //     case "company_name":
  //       return item.company_name.toLowerCase().includes(searchLower);
  //     case "company_nature":
  //       return item.company_nature.toLowerCase().includes(searchLower);
  //     case "company_email":
  //       return item.company_email.toLowerCase().includes(searchLower);
  //     case "company_city":
  //       return item.company_city.toLowerCase().includes(searchLower);
  //     case "company_country":
  //       return item.company_country.toLowerCase().includes(searchLower);
  //     case "company_designation":
  //       return item.company_designation.toLowerCase().includes(searchLower);
  //     case "Contact":
  //       return item.contact.toString().toLowerCase().includes(searchLower);
  //     case "status":
  //       return item.status.toLowerCase().includes(searchLower);
  //     case "contact_person":
  //       return contactPerson.includes(searchLower); // Add contact person filter
  //     default:
  //       return (
  //         item.company_name.toLowerCase().includes(searchLower) ||
  //         item.company_nature.toLowerCase().includes(searchLower) ||
  //         item.company_email.toLowerCase().includes(searchLower) ||
  //         item.company_city.toLowerCase().includes(searchLower) ||
  //         item.company_country.toLowerCase().includes(searchLower) ||
  //         item.company_designation.toLowerCase().includes(searchLower) ||
  //         item.contact.toLowerCase().includes(searchLower) ||
  //         item.status.toLowerCase().includes(searchLower) ||
  //         contactPerson.includes(searchLower) // Add contact person to default filter
  //       );
  //   }
  // });

  // const applyFilter = () => {
  //   console.log(filterStatus);
  //   axios
  //     .get(BASE_URL + "/vendors/filterVendors", {
  //       params: {
  //         filterStatus,
  //         filterDesignation,
  //       },
  //     })
  //     .then((res) => {
  //       setShowData(res.data);
  //     });
  // };

  // const clearFilter = () => {
  //   setSearchText("");
  //   setFilterColumn("");
  //   setFilterDesignation("");
  //   setFilterStatus("");
  //   reloadTable();
  // };

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

          generateYears(dateOfBirth); // Reset/Initialize Year List based on selected date of birth
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required
      />
    )
  );

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
              {authrztn.includes("Vendors-Add") &&
                (uniqueSelectedVendor.length > 0 ? (
                  <>
                    <button
                      className="btn btn-secondary title-button me-2"
                      onClick={() => setShowChangeStatusModal(true)}
                    >
                      <ArrowsClockwise className="fs-5" color="#f2f2f2" />{" "}
                      Change Status
                    </button>
                    <button
                      className="btn btn-danger title-button"
                      onClick={handleBulkDeleteVendor}
                    >
                      <i
                        className="fas fa-trash"
                        style={{
                          cursor: "pointer",
                          fontSize: "1rem",
                        }}
                      ></i>{" "}
                      Delete <span>({uniqueSelectedVendor.length})</span>
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary d-flex align-items-center title-button"
                    onClick={handleShow}
                  >
                    <i className="bx bx-plus fs-5"></i> Add Vendor
                  </button>
                ))}
            </div>
          </div>
          <div className="w-100 row mx-auto mt-4">
            <div className="col-sm mb-2">
              <span>Business Status</span>
              <select
                name="status"
                id="status"
                className="form-select"
                value={filterStatus}
                onChange={handleFilterStatusChange}
              >
                <option value="" selected disabled>
                  Select Status
                </option>
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="col-sm mb-2">
              <span>Business Designation</span>
              <select
                name=""
                id=""
                className="form-select"
                value={filterDesignation}
                onChange={handleFilterDesignationChange}
              >
                <option value="" selected disabled>
                  Select Designation
                </option>
                <option value="All">All</option>
                <option value="Local">Local</option>
                <option value="Overseas">Overseas</option>
              </select>
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
            <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container">
              {/* <button className="btn" onClick={applyFilter}>
                Apply Filter
              </button>
              <button className="btn btn-secondary" onClick={clearFilter}>
                Clear Filter
              </button> */}
            </div>
            <div className="col-sm"></div>
          </div>
          <div className="w-100 mt-2 container-fluid">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchText}
                onChange={handleSearchChange}
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
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "fname" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("fname")}
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
          <div className="mt-3 container-fluid" style={{ maxWidth: "78.5vw" }}>
            <DataTable
              columns={columns}
              data={pagination.data}
              customStyles={customStyles}
              onRowClicked={(row) => {
                navigate(`../purchases/vendor-update/${row.id}`);
              }}
              className="dataTable data-table-cell-width"
            />
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
              <div className="mt-2">
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="tag-all-product"
                    value={tagAllProduct}
                    onChange={(e) => setTagAllProduct(e.target.checked)}
                  />
                  <label class="form-check-label" for="tag-all-product">
                    Tag All Product
                  </label>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-sm">
                  <Form.Group className="mb-3" controlId="companyName">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={companyName}
                      placeholder="Enter Name"
                      onChange={(e) => setcompanyName(e.target.value)}
                      required
                      isInvalid={validated && !companyName.trim()}
                    />
                    <Form.Control.Feedback type="invalid">
                      Company name is required.
                    </Form.Control.Feedback>
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
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="text"
                      value={emailAddress}
                      placeholder="Enter Email"
                      onChange={(e) => setemailAddress(e.target.value)}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row w-100 mt-3">
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3" controlId="companyAddress">
                    <Form.Label>Company Address</Form.Label>
                    <Form.Control
                      type="text"
                      value={companyAddress}
                      placeholder="Enter Address"
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3" controlId="companyAddress">
                    <Form.Label>Supplier Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={supplierCode}
                      placeholder="Enter Code"
                      onChange={(e) => setSupplierCode(e.target.value)}
                    />
                  </Form.Group>
                </div>
                <div className="col-12 col-md-4">
                  <Form.Group className="mb-3" controlId="city">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
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
                    <Form.Label>
                      Country <span className="text-danger">*</span>
                    </Form.Label>
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
                  <span>
                    Currency <span className="text-danger">*</span>
                  </span>
                  <select
                    name=""
                    id=""
                    required
                    className="form-select"
                    onChange={(e) => setCurrencyID(e.target.value)}
                  >
                    <option value="" selected disabled>
                      Select Currency
                    </option>
                    {currency.map((item, index) => (
                      <option key={index} value={item.id}>
                        {item.currency_name} -{" "}
                        {currencyList[item.currency_name]}
                      </option>
                    ))}
                  </select>
                </div>
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
                          First Name
                          {/* <span className="text-danger">*</span> */}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          // required
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
                          Last Name
                          {/* <span className="text-danger">*</span> */}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          // required
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
                        <CustomDatePicker
                          label={"Birthday"}
                          selected={new Date(dob)}
                          handleDateChange={handleDateChange}
                          CustomInput={CustomInput}
                          validated={validated}
                        />
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
                        <Form.Label>
                          Cellphone No.
                          {/* <span className="text-danger">*</span> */}
                        </Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <Form.Control
                            type="text"
                            // required
                            placeholder="Enter Cellphone Number"
                            value={contactNo}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => setContactNo(e.target.value)}
                            maxLength={11}
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
                            maxLength={11}
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
              <Button variant="secondary" type="button" onClick={handleClose}>
                Close
              </Button>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Change Status Modal */}
      <Modal
        show={showChangeStatusModal}
        onHide={() => setShowChangeStatusModal(false)}
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>Change Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label htmlFor="change-status">Status</label>
          <select
            name="change-status"
            id="change-status"
            value={changeToStatus}
            onChange={(e) => setChangeToStatus(e.target.value)}
            className="form-select"
          >
            <option value="" selected disabled>
              Select Status
            </option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-primary" onClick={handleChangeStatus}>
            Save
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowChangeStatusModal(false)}
          >
            Close
          </button>
        </Modal.Footer>
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
