import React, { useState, useEffect, useRef } from "react";
import swal from "sweetalert";
// import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { Plus, FadersHorizontal } from "@phosphor-icons/react";
import { customStyles } from "../../assets/global/table-style";
import DataTable from "react-data-table-component";
import { useForm } from "react-hook-form";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { Pagination } from "react-bootstrap";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { ArrowsClockwise } from "@phosphor-icons/react";
import CustomDatePicker from "../../components/CustomDatePicker";

function User({ authrztn }) {
  const yearRef = useRef();
  const [show, setShow] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [userRoleData, setUserRoleData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [validated, setValidated] = useState(false);
  const [gender, setGender] = useState("Male");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  //for password condition
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [validation, setValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    isLongEnough: false,
    passwordsMatch: false,
  });
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState([]);
  const [changeToStatus, setChangeToStatus] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const userLoggedID = useDecodeToken();

  const [selectYear, setSelectYear] = useState(false);
  const [yearList, setYearList] = useState([]);

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

  useEffect(() => {
    setValidation({
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      isLongEnough: password.length >= 8,
      passwordsMatch:
        password && confirmPassword ? password === confirmPassword : false,
    });
  }, [password, confirmPassword]);
  //for password condition END

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const {
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: true,
      birthday: yesterday,
    },
  });
  // const userAccessType = watch("userAccessType");
  const onInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  };
  const onInputFloat = (e) => {
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");
  };

  const handleGenderChange = (event) => {
    setGender(event.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(
      (prevShowConfirmPassword) => !prevShowConfirmPassword
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
    setValue("birthday", date);
  };

  const handleResetToToday = (changeYear, changeMonth) => {
    const currentYear = new Date().getFullYear();

    setValue("birthday", new Date());

    generateYears(); // Reset Year List

    changeYear(currentYear); // Set year

    changeMonth(
      months.indexOf(
        months[new Date().getMonth()] // Set month
      )
    );
  };

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setShowUpdateModal(false);
    setValidated(false);
    setIsEditing(false);
    reset();
    setGender("Male");
    setValidation({
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      isLongEnough: false,
      passwordsMatch: false,
    });
  };

  const pagination = useServerPagination(
    BASE_URL + "/masterList/fetchTableForFilter",
    10
  );

  const reloadTable = async () => {
    pagination.updateParams({
      selectedStatus,
      filterColumn,
      searchText,
    });
    setIsLoading(false);
    // await axios
    //   .get(BASE_URL + "/masterList/fetchTableForFilter", {
    //     params: {
    //       selectedStatus,
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((response) => {
    //     setTableData(response.data);
    //     setFilteredData(response.data);
    //     setIsLoading(false);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching roles:", error);
    //   });

    await axios
      .get(BASE_URL + "/userRole/fetchUserRole")
      .then((response) => {
        setUserRoleData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  useEffect(() => {
    setTableData(pagination.data);
    setFilteredData(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadTable();
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedStatus, searchText]);

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
      swal({
        title: "Create this new user?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const formData = new FormData(form);
          formData.append("gender", gender);
          formData.append("userLoggedID", userLoggedID);
          formData.append(
            "birthday",
            watch("birthday")
              ? format(new Date(watch("birthday")), "MMM/dd/yyy")
              : ""
          );

          const data = Object.fromEntries(formData.entries());
          const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
          if (!regex.test(data.email)) {
            swal({
              title: "Invalid email format",
              text: "Please follow the correct email format.",
              icon: "error",
              buttons: "OK",
            });
            return;
          }
          axios.post(`${BASE_URL}/masterList/create`, data).then((res) => {
            if (res.status === 200) {
              swal({
                title: "Success",
                text: "User created successfully",
                icon: "success",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                handleClose();
                reloadTable();
              });
            } else if (res.status === 201) {
              swal({
                title: "Email already exist",
                text: "Please input another email",
                icon: "error",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              });
            } else {
              swal({
                title: "Something Went Wrong",
                text: "Please contact your support immediately",
                icon: "error",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                handleClose();
                reloadTable();
              });
            }
          });
        }
      });
    }
    setValidated(true);
  };

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
      swal({
        title: "Update this User?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          const formData = new FormData(form);
          formData.append("gender", gender);
          formData.append("selectedTableId", selectedTableId);
          formData.append("userLoggedID", userLoggedID);
          formData.append(
            "birthday",
            watch("birthday")
              ? format(new Date(watch("birthday")), "MMM/dd/yyy")
              : ""
          );
          const data = Object.fromEntries(formData.entries());

          const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
          if (!regex.test(data.email)) {
            swal({
              title: "Invalid email format",
              text: "Please follow the correct email format.",
              icon: "error",
              buttons: "OK",
            });
            return;
          }

          axios.put(`${BASE_URL}/masterList/update`, data).then((res) => {
            // console.log(res);
            if (res.status === 200) {
              swal({
                title: "Success",
                text: "User updated successfully",
                icon: "success",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                handleClose();
                reloadTable();
              });
            } else if (res.status === 201) {
              swal({
                title: "Email already exist",
                text: "Please input another label",
                icon: "error",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              });
            } else {
              swal({
                title: "Something Went Wrong",
                text: "Please contact your support immediately",
                icon: "error",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                handleClose();
                reloadTable();
              });
            }
          });
        }
      });
    }
    setValidated(true);
  };

  const handleUpdateModal = async (data) => {
    setShowUpdateModal(true);
    setSelectedTableId(data.id);
    setValue("status", data.status === true ? true : false);
    setValue("firstName", data.fname);
    setValue("middleName", data.mname);
    setValue("lastName", data.lname);
    setValue("address", data.address);
    setValue("city", data.city);
    setValue("province", data.province);
    setValue("zipCode", data.zip_code);
    setValue("email", data.email);
    setValue("contactNumber", data.number);
    setValue("birthday", data.birthdate);
    setGender(data.gender);
    setValue("userAccessType", data.userrole_id);
    setValue("username", data.uname);
    setValue("password", data.password);
    setValue("confirmPassword", data.password);
    setValue("basicSalary", data.salary);
    setValue("dailyRate", data.daily_rate);
    setValue("maritalStatus", data.marital_status);

    setValidation({
      hasUpperCase: true,
      hasLowerCase: true,
      hasNumber: true,
      isLongEnough: true,
      passwordsMatch: true,
    });
  };

  const handleSearch = (value) => {
    if (value.trim() === "") {
      setFilteredData(tableData);
    } else {
      const filtered = tableData.filter((data) => {
        return (
          (data.emp_id?.toString().toLowerCase() || "").includes(value) ||
          (
            `${data.fname} ${data.mname} ${data.lname}`?.toLowerCase() || ""
          ).includes(value) ||
          (data.userRole.col_rolename?.toLowerCase() || "").includes(value) ||
          (
            (data.status === true ? "Active" : "Inactive")?.toLowerCase() || ""
          ).includes(value) ||
          (data.email?.toLowerCase() || "").includes(value) ||
          (data.city?.toLowerCase() || "").includes(value) ||
          (formatDatetime(data.createdAt)?.toLowerCase() || "").includes(
            value
          ) ||
          (data.description?.toLowerCase() || "").includes(value)
        );
      });
      setFilteredData(filtered);
    }
  };

  // const handleFilterStatus = async (status) => {
  //   const statuss = status;
  //   await axios
  //     .get(BASE_URL + "/masterList/filterStatus", {
  //       params: {
  //         statuss,
  //       },
  //     })
  //     .then((response) => {
  //       setTableData(response.data);
  //       setFilteredData(response.data);
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching roles:", error);
  //     });
  // };

  const handleFilterStatus = (e) => {
    setSelectedStatus(e.target.value);
  };

  //date format
  function formatDatetime(datetime) {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(datetime).toLocaleString("en-US", options);
  }

  const tableDataObject = [
    {
      name: (
        <input
          checked={selectedUser.length === tableData.length}
          onChange={(e) => {
            setSelectedUser(() => {
              return e.target.checked ? tableData.map((item) => item.id) : [];
            });
          }}
          type="checkbox"
        />
      ),
      selector: (row) => (
        <input
          checked={selectedUser.includes(row.id)}
          onChange={() => {
            setSelectedUser((prev) => {
              return !selectedUser.includes(row.id)
                ? [...prev, row.id]
                : prev.filter((userId) => userId !== row.id);
            });
          }}
          type="checkbox"
        />
      ),
      width: "8rem",
    },
    {
      name: "Employee ID",
      selector: (row) => row.emp_id,
    },
    {
      name: "Name",
      selector: (row) => `${row.fname} ${row.mname} ${row.lname}`,
    },
    {
      name: "Role",
      selector: (row) => row.userRole.col_rolename,
    },
    {
      name: "Email",
      selector: (row) => row.email,
    },
    {
      name: "City",
      selector: (row) => row.city,
    },
    {
      name: "Date Created",
      selector: (row) => format(row.createdAt, "MMM/dd/yyyy, hh:mm a"),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => (
        <div
          style={{
            padding: "5px 10px",
            borderRadius: "5px",
            textTransform: "uppercase",
            fontWeight: "bold",
            color: row.status === true ? "green" : "red",
          }}
        >
          {row.status === true ? "Active" : "Inactive"}
        </div>
      ),
    },
  ];

  // Handle Submit change status
  const handleChangeStatus = () => {
    // Update Status
    const updateStatus = async () => {
      try {
        const res = await axios.put(
          `${BASE_URL}/masterList/bulkMasterlistStatusUpdate`,
          {
            selectedUser,
            changeToStatus,
          }
        );

        if (res.status === 200) {
          swal({
            icon: "success",
            title: "Status Updated",
            text: "All selected items have been updated.",
          }).then(() => {
            setSelectedUser([]);
            setChangeToStatus("");
            setShowChangeStatusModal(false);
            reloadTable();
          });
        }
      } catch (error) {
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          timer: 2000,
        });
        console.error(error);
      }
    };

    // Confirmation
    swal({
      icon: "warning",
      title: "Are you sure?",
      text: "You are about to change the status of selected items.",
      buttons: ["Cancel", "OK"],
      dangerMode: true,
    })
      .then(async (confirm) => {
        if (!confirm) return;

        if (changeToStatus === "") {
          return swal({
            icon: "warning",
            title: "Warning",
            text: "Please select status before proceeding.",
          });
        }

        await updateStatus();
      })
      .catch((error) => {
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          timer: 2000,
        });
        console.error(error);
      });
  };

  const handleCancelEdit = () => {
    swal({
      icon: "warning",
      title: "Are you sure?",
      text: "Your changes will not be saved",
      dangerMode: true,
      buttons: ["Cancel", "OK"],
    }).then((confirm) => {
      if (confirm) {
        handleClose();
      }
    });
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, disabled, generateYears }, ref) => {
      return (
        <input
          type="text"
          className="form-control p-2 w-100"
          style={{
            cursor: "pointer",
            caretColor: "transparent",
          }}
          onClick={() => {
            onClick();

            const dateOfBirth = new Date(watch("birthday")).getFullYear();

            generateYears(dateOfBirth); // Reset/Initialize Year List based on selected date of birth
          }}
          value={value}
          ref={ref}
          placeholder="Select Date"
          required
          {...(disabled ? { readOnly: true } : {})}
        />
      );
    }
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
      ) : authrztn.includes("UserManagement-View") ? (
        <>
          <div className="my-container p-2">
            <div className="row mb-3">
              <div className="col-6 title-custom">
                <span className="fs-3">USER MANAGEMENT</span>
              </div>
              <div className="col-6">
                {selectedUser.length > 0 ? (
                  <button
                    className="btn btn-secondary float-end title-button"
                    onClick={() => setShowChangeStatusModal(true)}
                  >
                    <ArrowsClockwise className="fs-5" color="#f2f2f2" /> Change
                    Status
                  </button>
                ) : (
                  authrztn.includes("UserManagement-Add") && (
                    <button
                      className="float-end btn btn-primary d-flex align-items-center title-button"
                      onClick={handleShow}
                    >
                      {/* <Plus size={32} color="#f2f2f2" /> */}
                      <i className="bx bx-plus fs-5"></i>
                      Create
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="row">
              <div className="col-4">
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    onChange={handleFilterStatus}
                    value={selectedStatus}
                  >
                    <option value="All" selected>
                      All
                    </option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-4"></div>
              {/* <div className="col-4">
                <Form.Group className="mb-3">
                  <Form.Label></Form.Label>
                  <div class="input-group mb-3 border border-light border-radius-2">
                    <input
                      className="form-control"
                      type="text"
                      placeholder={`🔍 Search`}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    <span
                      className="input-group-text bg-body"
                      id="basic-addon2"
                    >
                      <FadersHorizontal size={32} />
                    </span>
                  </div>
                </Form.Group>
              </div> */}
            </div>
            <div className="mb-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
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
                        filterColumn === "employee-id" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("employee-id")}
                    >
                      Employee ID
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "name" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("name")}
                    >
                      Name
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "role" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("role")}
                    >
                      Role
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "email" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("email")}
                    >
                      Email
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "city" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("city")}
                    >
                      City
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <>
              <DataTable
                columns={tableDataObject}
                data={tableData}
                customStyles={customStyles}
                onRowClicked={handleUpdateModal}
                className="dataTable"
              />
              <PaginationControls {...pagination} />
            </>
            {/*------------------------- CREATE MODAL ----------------------*/}
            <Modal
              show={show}
              onHide={handleClose}
              backdrop="static"
              keyboard={false}
              size="xl"
            >
              <Form noValidate validated={validated} onSubmit={add}>
                <Modal.Header className="border-0" closeButton>
                  <Modal.Title>CREATE USER</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div className="w-100">
                    <div className="w-100 mt-2 d-flex align-items-center mb-2">
                      <span>General Information</span>
                      <hr className="flex-grow-1 mx-3" />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm mb-2">
                      <Form.Group>
                        <label htmlFor="status">Status</label>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="status"
                            {...register("status")}
                          />
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-sm"></div>
                  </div>
                  <div className="row">
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          First Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter First Name"
                          {...register("firstName", {
                            required: "First name is required",
                          })}
                        />
                        {errors.firstName && (
                          <span>{errors.firstName.message}</span>
                        )}
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>Middle Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter Middle Name"
                          {...register("middleName")}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Last Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Last Name"
                          {...register("lastName")}
                        />
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12 col-md-8">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Complete Address{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Address"
                          {...register("address", {
                            required: "Address is required",
                          })}
                        />
                        {errors.address && (
                          <span>{errors.address.message}</span>
                        )}
                      </Form.Group>
                    </div>
                    <div className="col-12 col-md-4"></div>
                  </div>
                  <div className="row">
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          City <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter City"
                          {...register("city")}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Province <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Province"
                          {...register("province")}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Zip Code <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Zip Code"
                          {...register("zipCode")}
                          onInput={onInput}
                          maxLength={5}
                        />
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12 col-md-8">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Email Address <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Email"
                          {...register("email", {
                            required: "Email is required",
                            // pattern: {
                            //   value:
                            //     /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                            //   message: "Invalid email address",
                            // },
                          })}
                        />
                        {errors.email && <span>{errors.email.message}</span>}
                      </Form.Group>
                    </div>
                    <div className="col-12 col-md-4">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Cellphone No. <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <Form.Control
                            type="text"
                            required
                            placeholder="Enter Number"
                            {...register("contactNumber", {
                              required: "Cellphone No. is required",
                              onChange: (e) => {
                                let value = e.target.value;

                                if (value.startsWith("0")) {
                                  value = value.replace(/^0+/, "");
                                }
                                setValue("contactNumber", value);
                              },
                            })}
                            onInput={onInput}
                            maxLength={10}
                          />
                        </div>
                        {errors.contactNumber && (
                          <span>{errors.contactNumber.message}</span>
                        )}
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Birthday <span className="text-danger">*</span>
                        </Form.Label>
                        {/* <Form.Control
                          type="date"
                          required
                          {...register("birthday", {
                            required: "Birthday is required",
                          })}
                        /> */}

                        <CustomDatePicker
                          label={"Birthday"}
                          selected={new Date(watch("birthday"))}
                          handleDateChange={handleDateChange}
                          CustomInput={CustomInput}
                          validated={validated}
                        />

                        {errors.birthday && (
                          <span>{errors.birthday.message}</span>
                        )}
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Marital Status <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          required
                          {...register("maritalStatus", {
                            required: "Marital status is required",
                          })}
                        >
                          <option value="" disabled selected>
                            Select Marital Status
                          </option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                        </Form.Select>
                        {errors.maritalStatus && (
                          <span>{errors.maritalStatus.message}</span>
                        )}
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId="gender">
                        <Form.Label>
                          Choose Gender <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="row">
                          <div className="col-sm mb-1">
                            <Form.Check
                              type="radio"
                              name="gender"
                              id="male"
                              label="Male"
                              value="Male"
                              checked={gender === "Male"}
                              onChange={handleGenderChange}
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
                              onChange={handleGenderChange}
                            />
                          </div>
                        </div>
                      </Form.Group>
                    </div>
                  </div>
                  <div className="w-100">
                    <div className="w-100 mt-2 d-flex align-items-center mb-2">
                      <span>Access Information</span>
                      <hr className="flex-grow-1 mx-3" />
                    </div>
                    <div className="row">
                      <div className="col-sm">
                        <Form.Group className="mb-3">
                          <Form.Label>User Access Type</Form.Label>
                          <Form.Select
                            required
                            {...register("userAccessType", {
                              required: "User access type is required",
                            })}
                          >
                            <option value="" disabled selected>
                              Select User Access
                              <span className="text-danger">*</span>
                            </option>
                            {userRoleData.map((data) => (
                              <option value={data.col_id}>
                                {data.col_rolename}
                              </option>
                            ))}
                          </Form.Select>
                          {errors.userAccessType && (
                            <span>{errors.userAccessType.message}</span>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-sm">
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Username <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            required
                            type="text"
                            placeholder="Enter Username"
                            {...register("username", {
                              required: "Username is required",
                            })}
                          />
                          {errors.username && (
                            <span>{errors.username.message}</span>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-sm">
                        {/* <Form.Group className="mb-3">
                          <Form.Label>
                            User Type <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            required
                            {...register("userType", {
                              required: "User Type is required",
                            })}
                          >
                            <option value="" disabled selected>
                              Select User Type
                            </option>
                            <option value="Customer">Customer</option>
                            <option value="Vendor">Vendor</option>
                            <option value="Company">Company</option>
                          </Form.Select>
                          {errors.userType && (
                            <span>{errors.userType.message}</span>
                          )}
                        </Form.Group> */}
                      </div>
                    </div>
                    {/* <div className="row">
                  <div className="col-sm">
                    <div className="position-relative password-containers">
                      <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          required
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          id="password"
                          placeholder="Enter Password"
                          {...register("password", {
                            required: "Password is required",
                            onChange: (e) => setPassword(e.target.value),
                          })}
                        />
                        {errors.password && (
                          <span>{errors.password.message}</span>
                        )}
                        <i
                          className={`fa-solid ${
                            showPassword ? "fa-eye-slash" : "fa-eye"
                          } position-absolute cursor-pointer fs-4`}
                          onClick={togglePasswordVisibility}
                        ></i>
                      </Form.Group>
                    </div>
                  </div>
                  <div className="col-sm">
                    <div className="position-relative password-containers">
                      <Form.Group className="mb-3">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control
                          required
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-control"
                          id="confirmPassword"
                          placeholder="Enter Password"
                          {...register("confirmPassword", {
                            required: "Confirm password is required",
                            onChange: (e) => setConfirmPassword(e.target.value),
                          })}
                        />
                        {errors.confirmPassword && (
                          <span>{errors.confirmPassword.message}</span>
                        )}
                        <i
                          className={`fa-solid ${
                            showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                          } position-absolute cursor-pointer fs-4`}
                          onClick={toggleConfirmPasswordVisibility}
                        ></i>
                      </Form.Group>
                    </div>
                  </div>
                  <div className="col-sm">
                    <div
                      style={{
                        color: validation.hasUpperCase ? "green" : "red",
                      }}
                    >
                      {validation.hasUpperCase ? "✔ " : "✘ "} At least one
                      uppercase letter
                    </div>
                    <div
                      style={{
                        color: validation.hasLowerCase ? "green" : "red",
                      }}
                    >
                      {validation.hasLowerCase ? "✔ " : "✘ "} At least one
                      lowercase letter
                    </div>
                    <div
                      style={{
                        color: validation.hasNumber ? "green" : "red",
                      }}
                    >
                      {validation.hasNumber ? "✔ " : "✘ "} At least one number
                    </div>
                    <div
                      style={{
                        color: validation.isLongEnough ? "green" : "red",
                      }}
                    >
                      {validation.isLongEnough ? "✔ " : "✘ "} At least 8
                      characters long
                    </div>
                    <div
                      style={{
                        color: validation.passwordsMatch ? "green" : "red",
                      }}
                    >
                      {validation.passwordsMatch ? "✔ " : "✘ "} Passwords match
                    </div>
                  </div>
                </div> */}
                  </div>
                  {/* <div className="w-100">
                <div className="w-100 mt-2 d-flex align-items-center mb-2">
                  <span>Salary Details</span>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="row">
                  <div className="col-sm">
                    <Form.Group className="mb-3">
                      <Form.Label>Basic Salary</Form.Label>
                      <Form.Control
                        type="text"
                        onInput={onInputFloat}
                        placeholder="Enter Salary"
                        {...register("basicSalary", {
                          required: "Basic salary is required",
                        })}
                      />
                      {errors.basicSalary && (
                        <span>{errors.basicSalary.message}</span>
                      )}
                    </Form.Group>
                  </div> 
                  <div className="col-sm">
                    <Form.Group className="mb-3">
                      <Form.Label>Daily Rate</Form.Label>
                      <Form.Control
                        type="text"
                        onInput={onInputFloat}
                        placeholder="Enter Daily Rate"
                        {...register("dailyRate", {
                          required: "Daily rate is required",
                        })}
                      />
                      {errors.dailyRate && (
                        <span>{errors.dailyRate.message}</span>
                      )}
                    </Form.Group>
                  </div>
                  <div className="col-sm"></div>
                </div>
              </div> */}
                </Modal.Body>
                <Modal.Footer>
                  <button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                  <Button type="submit" variant="primary">
                    Create
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal>

            {/*------------------------- UPDATE MODAL ----------------------*/}

            <Modal
              show={showUpdateModal}
              onHide={handleClose}
              backdrop="static"
              keyboard={false}
              size="xl"
            >
              <Form noValidate validated={validated} onSubmit={update}>
                <Modal.Header className="border-0" closeButton>
                  <Modal.Title>UPDATE USER</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div className="w-100">
                    <div className="w-100 mt-2 d-flex align-items-center mb-2">
                      <span>General Information</span>
                      <hr className="flex-grow-1 mx-3" />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm mb-2">
                      <Form.Group>
                        <label htmlFor="status">Status</label>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="status"
                            {...register("status")}
                            disabled={!isEditing}
                          />
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-sm"></div>
                  </div>
                  <div className="row">
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          First Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter First Name"
                          {...register("firstName", {
                            required: "First name is required",
                          })}
                          disabled={!isEditing}
                        />
                        {errors.firstName && (
                          <span>{errors.firstName.message}</span>
                        )}
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>Middle Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter Middle Name"
                          {...register("middleName")}
                          disabled={!isEditing}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Last Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Last Name"
                          {...register("lastName")}
                          disabled={!isEditing}
                        />
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12 col-md-8">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Complete Address{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Address"
                          {...register("address", {
                            required: "Address is required",
                          })}
                          disabled={!isEditing}
                        />
                        {errors.address && (
                          <span>{errors.address.message}</span>
                        )}
                      </Form.Group>
                    </div>
                    <div className="col-12 col-md-4"></div>
                  </div>
                  <div className="row">
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          City <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter City"
                          {...register("city")}
                          disabled={!isEditing}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Province <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Province"
                          {...register("province")}
                          disabled={!isEditing}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Zip Code <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Zip Code"
                          {...register("zipCode")}
                          disabled={!isEditing}
                          onInput={onInput}
                          maxLength={5}
                        />
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12 col-md-8">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Email Address <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Email"
                          {...register("email", {
                            required: "Email is required",
                            // pattern: {
                            //   value:
                            //     /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                            //   message: "Invalid email address",
                            // },
                          })}
                          disabled={!isEditing}
                        />
                        {errors.email && <span>{errors.email.message}</span>}
                      </Form.Group>
                    </div>
                    <div className="col-12 col-md-4">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Cellphone No. <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">+63</span>
                          <Form.Control
                            type="text"
                            required
                            placeholder="Enter Number"
                            {...register("contactNumber", {
                              required: "Cellphone No. is required",
                              onChange: (e) => {
                                let value = e.target.value;

                                if (value.startsWith("0")) {
                                  value = value.replace(/^0+/, "");
                                }
                                setValue("contactNumber", value);
                              },
                            })}
                            disabled={!isEditing}
                            onInput={onInput}
                            maxLength={10}
                          />
                        </div>
                        {errors.contactNumber && (
                          <span>{errors.contactNumber.message}</span>
                        )}
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Birthday <span className="text-danger">*</span>
                        </Form.Label>
                        {/* <Form.Control
                          type="date"
                          required
                          {...register("birthday", {
                            required: "Birthday is required",
                          })}
                        /> */}

                        <CustomDatePicker
                          label={"Birthday"}
                          selected={new Date(watch("birthday"))}
                          handleDateChange={handleDateChange}
                          CustomInput={CustomInput}
                          disabled={!isEditing}
                          validated={validated}
                        />

                        {errors.birthday && (
                          <span>{errors.birthday.message}</span>
                        )}
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Marital Status <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          required
                          {...register("maritalStatus", {
                            required: "Marital status is required",
                          })}
                          disabled={!isEditing}
                        >
                          <option value="" disabled selected>
                            Select Marital Status
                          </option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                        </Form.Select>
                        {errors.maritalStatus && (
                          <span>{errors.maritalStatus.message}</span>
                        )}
                      </Form.Group>
                    </div>
                    <div className="col-sm">
                      <Form.Group className="mb-3" controlId="gender">
                        <Form.Label>
                          Choose Gender <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="row">
                          <div className="col-sm mb-1">
                            <Form.Check
                              type="radio"
                              name="gender"
                              id="male"
                              label="Male"
                              value="Male"
                              checked={gender === "Male"}
                              onChange={handleGenderChange}
                              disabled={!isEditing}
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
                              onChange={handleGenderChange}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                      </Form.Group>
                    </div>
                  </div>
                  <div className="w-100">
                    <div className="w-100 mt-2 d-flex align-items-center mb-2">
                      <span>Access Information</span>
                      <hr className="flex-grow-1 mx-3" />
                    </div>
                    <div className="row">
                      <div className="col-sm">
                        <Form.Group className="mb-3">
                          <Form.Label>
                            User Access Type
                            <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            required
                            {...register("userAccessType", {
                              required: "User access type is required",
                            })}
                            disabled={!isEditing}
                          >
                            <option value="" disabled selected>
                              Select User Access
                            </option>
                            {userRoleData.map((data) => (
                              <option value={data.col_id}>
                                {data.col_rolename}
                              </option>
                            ))}
                          </Form.Select>
                          {errors.userAccessType && (
                            <span>{errors.userAccessType.message}</span>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-sm">
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Username <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            required
                            type="text"
                            placeholder="Enter Username"
                            {...register("username", {
                              required: "Username is required",
                            })}
                            disabled={!isEditing}
                          />
                          {errors.username && (
                            <span>{errors.username.message}</span>
                          )}
                        </Form.Group>
                      </div>
                      <div className="col-sm"></div>
                    </div>
                    <div className="row">
                      {/* <div className="col-sm">
                        <div className="position-relative password-containers">
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Password <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              required
                              type={showPassword ? "text" : "password"}
                              className="form-control"
                              id="password"
                              placeholder="Enter Password"
                              {...register("password", {
                                required: "Password is required",
                                onChange: (e) => setPassword(e.target.value),
                              })}
                            />
                            {errors.password && (
                              <span>{errors.password.message}</span>
                            )}
                            <i
                              className={`fa-solid ${
                                showPassword ? "fa-eye-slash" : "fa-eye"
                              } position-absolute cursor-pointer fs-4`}
                              onClick={togglePasswordVisibility}
                            ></i>
                          </Form.Group>
                        </div>
                      </div>
                      <div className="col-sm">
                        <div className="position-relative password-containers">
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Confirm Password{" "}
                              <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              required
                              type={showConfirmPassword ? "text" : "password"}
                              className="form-control"
                              id="confirmPassword"
                              placeholder="Enter Password"
                              {...register("confirmPassword", {
                                required: "Confirm password is required",
                                onChange: (e) =>
                                  setConfirmPassword(e.target.value),
                              })}
                            />
                            {errors.confirmPassword && (
                              <span>{errors.confirmPassword.message}</span>
                            )}
                            <i
                              className={`fa-solid ${
                                showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                              } position-absolute cursor-pointer fs-4`}
                              onClick={toggleConfirmPasswordVisibility}
                            ></i>
                          </Form.Group>
                        </div>
                      </div>
                      <div className="col-sm">
                        <div
                          style={{
                            color: validation.hasUpperCase ? "green" : "red",
                          }}
                        >
                          {validation.hasUpperCase ? "✔ " : "✘ "} At least one
                          uppercase letter
                        </div>
                        <div
                          style={{
                            color: validation.hasLowerCase ? "green" : "red",
                          }}
                        >
                          {validation.hasLowerCase ? "✔ " : "✘ "} At least one
                          lowercase letter
                        </div>
                        <div
                          style={{
                            color: validation.hasNumber ? "green" : "red",
                          }}
                        >
                          {validation.hasNumber ? "✔ " : "✘ "} At least one
                          number
                        </div>
                        <div
                          style={{
                            color: validation.isLongEnough ? "green" : "red",
                          }}
                        >
                          {validation.isLongEnough ? "✔ " : "✘ "} At least 8
                          characters long
                        </div>
                        <div
                          style={{
                            color: validation.passwordsMatch ? "green" : "red",
                          }}
                        >
                          {validation.passwordsMatch ? "✔ " : "✘ "} Passwords
                          match
                        </div>
                      </div> */}
                    </div>
                  </div>
                  {/* <div className="w-100">
                <div className="w-100 mt-2 d-flex align-items-center mb-2">
                  <span>Salary Details</span>
                  <hr className="flex-grow-1 mx-3" />
                </div>
                <div className="row">
                  <div className="col-sm">
                    <Form.Group className="mb-3">
                      <Form.Label>Basic Salary</Form.Label>
                      <Form.Control
                        type="text"
                        onInput={onInputFloat}
                        placeholder="Enter Salary"
                        {...register("basicSalary", {
                          required: "Basic salary is required",
                        })}
                      />
                      {errors.basicSalary && (
                        <span>{errors.basicSalary.message}</span>
                      )}
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3">
                      <Form.Label>Daily Rate</Form.Label>
                      <Form.Control
                        type="text"
                        onInput={onInputFloat}
                        placeholder="Enter Daily Rate"
                        {...register("dailyRate", {
                          required: "Daily rate is required",
                        })}
                      />
                      {errors.dailyRate && (
                        <span>{errors.dailyRate.message}</span>
                      )}
                    </Form.Group>
                  </div>
                  <div className="col-sm"></div>
                </div>
              </div> */}
                </Modal.Body>
                <Modal.Footer>
                  {!isEditing && (
                    <button
                      type="button"
                      variant="secondary"
                      onClick={handleClose}
                      className="btn btn-secondary"
                    >
                      Close
                    </button>
                  )}
                  {authrztn.includes("UserManagement-Edit") &&
                    (!isEditing ? (
                      <Button
                        variant="primary"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline-secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={
                            !validation.hasUpperCase ||
                            !validation.hasLowerCase ||
                            !validation.hasNumber ||
                            !validation.isLongEnough ||
                            !validation.passwordsMatch
                          }
                        >
                          Update
                        </Button>
                      </>
                    ))}
                </Modal.Footer>
              </Form>
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
                  onChange={(e) => {
                    setChangeToStatus(e.target.value);
                  }}
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
                <button
                  className="btn btn-primary"
                  onClick={handleChangeStatus}
                >
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
          </div>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
}

export default User;
