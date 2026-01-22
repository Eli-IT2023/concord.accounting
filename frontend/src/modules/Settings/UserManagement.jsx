import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form"; // Add this import
import swal from "sweetalert";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { Plus } from "@phosphor-icons/react";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import { FaCalendarAlt } from "react-icons/fa";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { Link } from "react-router-dom";
import "../../assets/css/lionchem.css";

function User({ authrztn }) {
  const [show, setShow] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [userRoleData, setUserRoleData] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validated, setValidated] = useState(false);
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validation, setValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    isLongEnough: false,
    passwordsMatch: false,
  });
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [filterColumn, setFilterColumn] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  // Pagination setup
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/masterList/getMasterListData"
  );
  const pagination = useServerPagination(paginationUrl, 10);

  useEffect(() => {
    if (!pagination.loading) {
      setIsLoading(false);
    }
  }, [pagination.loading]);

  const userLoggedID = useDecodeToken();

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

  const {
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: true,
    },
  });

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

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setShowUpdateModal(false);
    setValidated(false);
    reset();
    setGender("");
    setValidation({
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      isLongEnough: false,
      passwordsMatch: false,
    });
  };

  const reloadTable = () => {
    setPaginationUrl(BASE_URL + "/masterList/getMasterListData");
    pagination.updateParams({});
    try {
      axios
        .get(BASE_URL + "/userRole/fetchUserRole")
        .then((response) => {
          setUserRoleData(response.data);
        })
        .catch((error) => {
          console.error("Error fetching roles:", error);
        });
    } catch (error) {
      console.error("Error reloading table:", error);
    }
  };

  const fetchUserRole = async () => {
    try {
      axios
        .get(BASE_URL + "/userRole/fetchUserRole")
        .then((response) => {
          setUserRoleData(response.data);
        })
        .catch((error) => {
          console.error("Error fetching roles:", error);
        });
    } catch (error) {
      console.error("Error reloading table:", error);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [selectedStatus, searchText, filterColumn]);

  // useEffect(() => {
  //   reloadTable();
  // }, [selectedStatus, searchText, filterColumn]);

  const add = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setValidated(true);

    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill in the red text fields.",
      });
      return;
    }

    // Email validation
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!regex.test(watch("email"))) {
      swal({
        title: "Invalid email format",
        text: "Please follow the correct email format.",
        icon: "error",
        buttons: "OK",
      });
      return;
    }

    const confirmed = await swal({
      title: "Create this new user?",
      text: "",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
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

      const res = await axios.post(`${BASE_URL}/masterList/create`, data);

      if (res.status === 200) {
        await swal({
          title: "Success",
          text: "User created successfully",
          icon: "success",
          buttons: false,
          timer: 2000,
        });
        handleClose();
        reloadTable();
        setIsSubmitting(false);
        setValidated(false);
      } else if (res.status === 201) {
        swal({
          title: "Email already exists",
          text: "Please input another email",
          icon: "error",
          buttons: true,
        }).then(() => {
          setIsSubmitting(false);
        });
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      swal({
        title: "Error",
        text: error.response?.data?.message || "Something went wrong",
        icon: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          setIsSubmitting(true);

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
                setIsSubmitting(false);
              });
            } else if (res.status === 201) {
              swal({
                title: "Email already exists",
                text: "Please input another email",
                icon: "error",
                buttons: true,
              }).then(() => {
                setIsSubmitting(false);
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
                setIsSubmitting(false);
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
    setValue("maritalStatus", data.marital_status);
    setGender(data.gender);
    setValue("userAccessType", data.userrole_id);
    setValue("username", data.uname);
    setValue("password", data.password);
    setValue("confirmPassword", data.password);
    setValue("basicSalary", data.salary);
    setValue("dailyRate", data.daily_rate);

    setValidation({
      hasUpperCase: true,
      hasLowerCase: true,
      hasNumber: true,
      isLongEnough: true,
      passwordsMatch: true,
    });
  };

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("all");
    setSelectedStatus("All");
    setPaginationUrl(BASE_URL + "/masterList/getMasterListData");
    pagination.updateParams({});
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/masterList/getMasterListData");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/masterList/searchUsers");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all",
      });
    }
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
        required
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
      ) : authrztn.includes("UserManagement-View") ? (
        <>
          <div className="my-container p-2">
            <div className="row mb-3">
              <div className="col-6 title-custom">
                <span className="fs-3">USER MANAGEMENT</span>
              </div>
              <div className="col-6">
                {authrztn.includes("UserManagement-Add") && (
                  <button
                    className="float-end btn btn-primary d-flex align-items-center title-button"
                    onClick={handleShow}
                  >
                    <i className="bx bx-plus fs-5"></i>
                    Create
                  </button>
                )}
              </div>
            </div>

            <div className="row">
              <div className="col-4">
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      const params = {};
                      if (searchText) {
                        params.searchText = searchText;
                        params.filterColumn = filterColumn;
                      }
                      if (e.target.value !== "All") {
                        params.selectedStatus = e.target.value;
                      }
                      setPaginationUrl(
                        BASE_URL + "/masterList/getMasterListData"
                      );
                      pagination.updateParams(params);
                    }}
                    value={selectedStatus}
                  >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-4"></div>
            </div>

            <div className="mb-3">
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
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "date" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("date")}
                    >
                      Date
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="container-fluid">
              <div className="table-responsive data-table scrollable-contents">
                <table
                  className="table table-hover table-responsive"
                  id="userManagementTable"
                >
                  <thead className="bg-light">
                    <tr>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                      >
                        EMPLOYEE ID
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                      >
                        NAME
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                      >
                        ROLE
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                      >
                        EMAIL
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                      >
                        CITY
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                      >
                        DATE CREATED
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4", fontSize: "14px" }}
                      >
                        STATUS
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.error ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center text-danger py-4"
                        >
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
                        <td colSpan={7} className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <span>No data available</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagination.data.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleUpdateModal(item)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="text-center">{item.emp_id}</td>
                          <td className="text-center">{`${item.fname} ${item.mname} ${item.lname}`}</td>
                          <td className="text-center">
                            {item.userRole?.col_rolename}
                          </td>
                          <td className="text-center">{item.email}</td>
                          <td className="text-center">{item.city}</td>
                          <td className="text-center">
                            {new Date(item.createdAt)
                              .toLocaleString("en-US", {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                              .replace(/,([^,]*)$/, " -$1")}
                          </td>
                          <td>
                            <div
                              className="text-center"
                              style={{
                                padding: "5px 10px",
                                borderRadius: "5px",
                                textTransform: "uppercase",
                                fontWeight: "bold",
                                color: item.status === true ? "green" : "red",
                              }}
                            >
                              {item.status === true ? "Active" : "Inactive"}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <PaginationControls {...pagination} />
            </div>
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
                          Date of Birth <span className="text-danger">*</span>
                        </Form.Label>
                        {/* <Form.Control
                          type="date"
                          required
                          {...register("birthday", {
                            required: "Birthday is required",
                          })}
                        /> */}
                        <DatePicker
                          selected={watch("birthday")}
                          onChange={(date) => setValue("birthday", date)}
                          dateFormat={"MM/dd/yyyy"}
                          customInput={<CustomInput />}
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
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
                          <Form.Label>
                            User Access Type
                            <span className="text-danger ps-1">*</span>
                          </Form.Label>
                          <Form.Select
                            required
                            {...register("userAccessType", {
                              required: "User access type is required",
                            })}
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
                    className="btn btn-outline-secondary"
                  >
                    Close
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="d-flex align-items-center justify-content-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Submitting...
                      </>
                    ) : (
                      <>Create</>
                    )}
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
                          Municipality <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="Enter Municipality"
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
                        <DatePicker
                          selected={watch("birthday")}
                          dateFormat={"MMM dd, yyyy"}
                          onChange={(date) => setValue("birthday", date)}
                          customInput={<CustomInput />}
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                          popperPlacement="bottom"
                          popperProps={{
                            strategy: "absolute",
                          }}
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
                          <Form.Label>
                            User Access Type
                            <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            required
                            {...register("userAccessType", {
                              required: "User access type is required",
                            })}
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
                  <button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    className="btn btn-outline-secondary"
                  >
                    Close
                  </button>
                  {authrztn.includes("UserManagement-Edit") && (
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={
                        !validation.hasUpperCase ||
                        !validation.hasLowerCase ||
                        !validation.hasNumber ||
                        !validation.isLongEnough ||
                        !validation.passwordsMatch ||
                        isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Submitting...
                        </>
                      ) : (
                        <>Update</>
                      )}
                    </Button>
                  )}
                </Modal.Footer>
              </Form>
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
