import React, { useState, useEffect } from "react";
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
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import Select from "react-select";
import { selectCustomStyles } from "../../assets/global/selectCustomStyles";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

function Expenses2({ authrztn }) {
  const [show, setShow] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [expensesOne, setExpensesOne] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [productionCheckBox, setProductionCheckBox] = useState(false);
  const [type, setType] = useState("");
  const [subTypeName, setSubTypeName] = useState("");
  const [description, setDescription] = useState("");
  const [validated, setValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [filterStatus, setFilterStatus] = useState("Active");
  const [isArchive, setIsArchive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setShowUpdateModal(false);
    setValidated(false);
    setIsEditing(false);
    setProductionCheckBox(false);
    setType("");
    setSubTypeName("");
    setDescription("");
  };

  const userLoggedID = useDecodeToken();

  const pagination = useServerPagination(
    BASE_URL + "/expenses2/fetchTableForFilter",
    10
  );

  const reloadTable = async () => {
    pagination.updateParams({
      filterStatus,
      filterColumn,
      searchText,
    });
    setFetchTrigger(true);
    // setIsLoading(false);
    // await axios
    //   .get(BASE_URL + "/expenses2/fetchTableForFilter", {
    //     params: {
    //       filterStatus,
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
      .get(BASE_URL + "/expenseone/getExpensesOne")
      .then((response) => {
        setExpensesOne(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  useEffect(() => {
    if (pagination.data) {
      setTableData(pagination.data);
      setFilteredData(pagination.data);
      if (pagination.data.length > 0) {
        setIsLoading(false);
      }

      if (pagination.data.length === 0 && fetchTrigger) {
        setIsLoading(false);
      }
    }
  }, [pagination.data]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadTable();
    }, 1000);
    return () => clearTimeout(timer);
  }, [filterStatus, searchText, filterColumn]);

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
        title: "Create this new Sub Type?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/expenses2/createExpenses2`, {
              productionCheckBox,
              type: type?.value,
              subTypeName,
              description,
              userLoggedID,
            })
            .then((res) => {
              // console.log(res);
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Sub Type created successfully",
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
                  title: "Sub Type already exist",
                  text: "Please input another sub type name",
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

  const handleArchive = (id) => {
    swal({
      title: "Are You Sure?",
      text: "Archive this Sub Type?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        axios
          .post(`${BASE_URL}/expenses2/archive`, {
            selectedTableId: id,
            userLoggedID,
          })
          .then((res) => {
            // console.log(res);
            if (res.status === 200) {
              swal({
                title: "Success",
                text: "Sub Type archive successfully",
                icon: "success",
                buttons: false,
                timer: 2000,
                dangerMode: true,
              }).then(() => {
                handleClose();
                reloadTable();
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
  };

  const handleUnarchive = async (id) => {
    swal({
      title: "Confirm Unarchive",
      text: "Are you sure you want to unarchive this expenses?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          const response = await axios.put(
            `${BASE_URL}/expenses2/unarchiveExpense2`,
            {
              selectedTableId: id,
              userLoggedID,
            }
          );

          if (response.status === 200) {
            swal({
              title: "Expense Sub-Type Unarchived Successfully!",
              text: "The expense sub-type has been successfully unarchived.",
              icon: "success",
              button: "OK",
            }).then(() => {
              handleClose();
              reloadTable();
            });
          }
        } catch (err) {
          console.log(err);
        }
      }
    });
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
        title: "Are You Sure?",
        text: "Update this Sub Type?",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/expenses2/updateExpenses2`, {
              selectedTableId,
              productionCheckBox,
              type: type?.value,
              subTypeName,
              description,
              userLoggedID,
            })
            .then((res) => {
              // console.log(res);
              if (res.status === 200) {
                swal({
                  title: "Success",
                  text: "Sub Type updated successfully",
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
                  title: "Sub Type already exist",
                  text: "Please input another sub type name",
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

  const handleSearch = (value) => {
    if (value.trim() === "") {
      setFilteredData(tableData);
    } else {
      const filtered = tableData.filter((data) => {
        return (
          (data.expenses_type?.toString().toLowerCase() || "").includes(
            value
          ) ||
          (data.sub_type?.toLowerCase() || "").includes(value) ||
          (formatDatetime(data.createdAt)?.toLowerCase() || "").includes(
            value
          ) ||
          (data.description?.toLowerCase() || "").includes(value)
        );
      });
      setFilteredData(filtered);
    }
  };

  const handleUpdateModal = async (data) => {
    console.log(data);
    console.log({
      value: data.expenses_one.expenses_one_id,
      label: data.expenses_one.expenses_type_one,
    });
    setShowUpdateModal(true);
    setSelectedTableId(data.id);
    setProductionCheckBox(data.isForProduction);
    setType({
      value: data.expenses_one.expenses_one_id,
      label: data.expenses_one.expenses_type_one,
    });
    setSubTypeName(data.sub_type);
    setIsArchive(data.isArchive);
    setDescription(data.description);
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

  // Truncate text
  const truncateText = (str, maxLength) => {
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
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
  // const filteredTableData = filteredData.filter(
  //   (data) => data.id !== 1 && data.id !== 2
  // );
  const tableDataObject = [
    {
      name: "Expense Type",
      selector: (row) => row.expenses_one.expenses_type_one,
    },
    {
      name: "Expense Sub-Type",
      selector: (row) => row.sub_type,
    },
    {
      name: "Description",
      selector: (row) => (
        <div title={row.description}>
          {row.description === "" ? "--" : truncateText(row.description, 125)}
        </div>
      ),
    },
    {
      name: "Date Created",
      selector: (row) => format(row.createdAt, "MMM/dd/yyyy, hh:mm a"),
    },
    {
      name: "Status",
      selector: (row) => row.isArchive,
      cell: (row) => {
        let fontColor;
        row.isArchive === false
          ? (fontColor = "#3B9F3F")
          : (fontColor = "#767676");
        return (
          <div
            style={{
              padding: "5px 10px",
              borderRadius: "5px",
              color: fontColor,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            {" "}
            {row.isArchive === false ? "Active" : "Archive"}
          </div>
        );
      },
    },
  ];

  if (authrztn.includes("ExpensesType2-Delete")) {
    tableDataObject.push({
      name: "Action",
      selector: (row) => (
        <>
          {row.isArchive ? (
            <>
              <Button variant="danger" onClick={() => handleUnarchive(row.id)}>
                Unarchive
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                onClick={() => handleArchive(row.id)}
                variant="danger"
              >
                Archive
              </Button>
            </>
          )}
        </>
      ),
    });
  }

  const handleFilterStatus = async (status) => {
    const statuss = status;
    await axios
      .get(BASE_URL + "/expenses2/filter", {
        params: {
          statuss,
        },
      })
      .then((response) => {
        setTableData(response.data);
        setFilteredData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  // Expense Type Options for dropdown select
  const expenseTypeOptions = expensesOne.map((item) => ({
    value: item.expenses_one_id,
    label: item.expenses_type_one,
  }));

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
      ) : authrztn.includes("ExpensesType2-View") ? (
        <>
          <div className="my-container">
            <div className="row mb-3">
              <div className="col-6 title-custom">
                <span className="fs-3">EXPENSE SUB-TYPE</span>
              </div>
              <div className="col-6">
                {authrztn.includes("ExpensesType2-Add") && (
                  <button
                    className="float-end btn btn-primary d-flex align-items-center title-button"
                    onClick={handleShow}
                  >
                    {/* <Plus size={32} color="#f2f2f2" /> */}
                    <i className="bx bx-plus fs-5"></i>
                    Create
                  </button>
                )}
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-4">
                <Form.Group>
                  <Form.Label>Filter</Form.Label>
                  <Form.Select
                    value={filterStatus}
                    onChange={handleFilterStatusChange}
                  >
                    <option value="All">All</option>
                    <option value="Archive">Archive</option>
                    <option value="Active" selected>
                      Active
                    </option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-4"></div>
              <div className="col-4">
                {/* <div class="input-group mb-3 border border-light border-radius-2">
              <span className="input-group-text bg-body" id="basic-addon2">
                <MagnifyingGlass size={20} color="#969696" />
              </span>
              <input
                className="form-control"
                type="text"
                placeholder={`Search`}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <span className="input-group-text bg-body" id="basic-addon2">
                <FadersHorizontal size={32} />
              </span>
            </div> */}
                {/* <Form.Group className="mb-3">
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
                </Form.Group> */}
              </div>
            </div>
            <div className="row mb-3">
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
                        filterColumn === "expenses_type" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("expenses_type")}
                    >
                      Expense Type
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "expenses_sub_type" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("expenses_sub_type")}
                    >
                      Expense Sub-Type
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item ${
                        filterColumn === "description" ? "active" : ""
                      }`}
                      onClick={() => setFilterColumn("description")}
                    >
                      Description
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
                <Modal.Header closeButton>
                  <Modal.Title>EXPENSES TYPE DETAILS</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                  <div className="row mb-2">
                    <div className="col-sm">
                      <Form.Group className="d-flex">
                        <div className="me-3 mt-1">
                          <input
                            type="checkbox"
                            checked={productionCheckBox}
                            onChange={(e) => {
                              setProductionCheckBox(e.target.checked);
                            }}
                            name="production-checkbox"
                            id="production-checkbox"
                            className="form-check-input border border-secondary "
                          />
                        </div>
                        <Form.Label
                          className="fs-5"
                          htmlFor="production-checkbox"
                        >
                          PRODUCTION
                          {/* <span className="text-danger mx-2">*</span> */}
                          {/* Tooltip  */}
                          <OverlayTrigger
                            placement="right"
                            overlay={
                              <Tooltip className="ms-1">
                                If checked, this will be used to calculate the
                                cost of production
                              </Tooltip>
                            }
                          >
                            {({ ref, ...triggerHandler }) => (
                              <i
                                className="fa-solid fa-circle-info d-inline-flex align-items-center text-primary fs-6 ms-2 mb-1"
                                style={{ cursor: "pointer" }}
                                ref={ref}
                                {...triggerHandler}
                              ></i>
                            )}
                          </OverlayTrigger>
                        </Form.Label>
                      </Form.Group>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <Form.Group controlId="exampleForm.ControlInput1">
                        <Form.Label className="fs-5">
                          EXPENSE TYPE:
                          <span className="text-danger mx-2">*</span>
                        </Form.Label>
                        {/* <Form.Select
                          onChange={(e) => setType(e.target.value)}
                          required
                          className="p-3"
                        >
                          <option selected disabled value="">
                            Select Expense Type
                          </option>
                          <option value="1">sample</option>
                          <option value="2">sample2</option>
                          {expensesOne.map((dept) => (
                            <option
                              key={dept.expenses_one_id}
                              value={dept.expenses_one_id}
                            >
                              {dept.expenses_type_one}
                            </option>
                          ))}
                        </Form.Select> */}
                        <Select
                          options={expenseTypeOptions}
                          value={type}
                          onChange={(selectedOption) => setType(selectedOption)}
                          placeholder={`Select Expense Type`}
                          styles={selectCustomStyles(
                            type,
                            validated,
                            "0.55rem"
                          )}
                          required
                        />
                      </Form.Group>
                    </div>
                    <div className="col-6">
                      <Form.Group controlId="exampleForm.ControlInput1">
                        <Form.Label className="fs-5">
                          EXPENSE SUB-TYPE:
                          <span className="text-danger mx-2">*</span>
                        </Form.Label>
                        <Form.Control
                          placeholder="Expenses Sub Type"
                          onChange={(e) =>
                            setSubTypeName(e.target.value.trim())
                          }
                          type="text"
                          required
                          className="p-3"
                        />
                      </Form.Group>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12">
                      <Form.Group controlId="exampleForm.ControlInput1">
                        <Form.Label className="fs-5">DESCRIPTION:</Form.Label>
                        <Form.Control
                          style={{
                            height: "200px",
                            maxHeight: "200px",
                            resize: "none",
                            overflowY: "auto",
                          }}
                          as="textarea"
                          type="text"
                          placeholder="Enter Remarks"
                          disabled={isArchive}
                          onChange={(e) =>
                            setDescription(e.target.value.trim())
                          }
                          maxLength={1000}
                        />
                      </Form.Group>
                    </div>
                  </div>
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
                <Modal.Header closeButton>
                  <Modal.Title>{`UPDATE EXPENSES TYPE DETAILS`}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                  <div className="row mb-2">
                    <div className="col-sm">
                      <Form.Group className="d-flex">
                        <div className="me-3 mt-1">
                          <input
                            type="checkbox"
                            checked={productionCheckBox}
                            onChange={(e) => {
                              setProductionCheckBox(e.target.checked);
                            }}
                            name="production-checkbox"
                            id="production-checkbox"
                            className="form-check-input border border-secondary"
                            disabled={
                              selectedTableId ===
                                "11111111-1111-1111-1111-111111111111" ||
                              isArchive ||
                              !isEditing
                            }
                          />
                        </div>
                        <Form.Label
                          className="fs-5"
                          htmlFor="production-checkbox"
                        >
                          PRODUCTION
                          {/* <span className="text-danger mx-2">*</span> */}
                          {/* Tooltip  */}
                          <OverlayTrigger
                            placement="right"
                            overlay={
                              <Tooltip className="ms-1">
                                If checked, this will be used to calculate the
                                cost of production
                              </Tooltip>
                            }
                          >
                            {({ ref, ...triggerHandler }) => (
                              <i
                                className="fa-solid fa-circle-info d-inline-flex align-items-center text-primary fs-6 ms-2 mb-1"
                                style={{ cursor: "pointer" }}
                                ref={ref}
                                {...triggerHandler}
                              ></i>
                            )}
                          </OverlayTrigger>
                        </Form.Label>
                      </Form.Group>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-6">
                      <Form.Group controlId="exampleForm.ControlInput1">
                        <Form.Label className="fs-5">
                          EXPENSE TYPE:
                          <span className="text-danger mx-2">*</span>
                        </Form.Label>
                        {/* <Form.Select
                          className="p-3"
                          onChange={(e) => setType(e.target.value)}
                          required
                          disabled={
                            selectedTableId ===
                              "11111111-1111-1111-1111-111111111111" ||
                            isArchive
                          }
                          value={type}
                        >
                          <option selected disabled value="">
                            Select Expense Type
                          </option>
                          {expensesOne.map((dept) => (
                            <option
                              key={dept.expenses_one_id}
                              value={dept.expenses_one_id}
                            >
                              {dept.expenses_type_one}
                            </option>
                          ))}
                        </Form.Select> */}
                        <Select
                          options={expenseTypeOptions}
                          value={type}
                          onChange={(selectedOption) => setType(selectedOption)}
                          placeholder={`Select Expense Type`}
                          styles={selectCustomStyles(
                            type,
                            validated,
                            "0.55rem"
                          )}
                          required
                          isDisabled={
                            selectedTableId ===
                              "11111111-1111-1111-1111-111111111111" ||
                            isArchive ||
                            !isEditing
                          }
                        />
                      </Form.Group>
                    </div>
                    <div className="col-6">
                      <Form.Group controlId="exampleForm.ControlInput1">
                        <Form.Label className="fs-5">
                          EXPENSE SUB-TYPE:
                          <span className="text-danger mx-2">*</span>
                        </Form.Label>
                        <Form.Control
                          className="p-3"
                          placeholder="Expenses Sub Type"
                          onChange={(e) =>
                            setSubTypeName(e.target.value.trim())
                          }
                          type="text"
                          required
                          disabled={
                            selectedTableId ===
                              "11111111-1111-1111-1111-111111111111" ||
                            isArchive ||
                            !isEditing
                          }
                          value={subTypeName}
                        />
                      </Form.Group>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12">
                      <Form.Group controlId="exampleForm.ControlInput1">
                        <Form.Label className="fs-5">DESCRIPTION:</Form.Label>
                        <Form.Control
                          style={{
                            height: "200px",
                            maxHeight: "200px",
                            resize: "none",
                            overflowY: "auto",
                          }}
                          as="textarea"
                          type="text"
                          placeholder="Enter Remarks"
                          onChange={(e) =>
                            setDescription(e.target.value.trim())
                          }
                          value={description}
                          disabled={
                            selectedTableId ===
                              "11111111-1111-1111-1111-111111111111" ||
                            isArchive ||
                            !isEditing
                          }
                          maxLength={1000}
                        />
                      </Form.Group>
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  {!isEditing && (
                    <button
                      type="button"
                      variant="secondary"
                      onClick={handleClose}
                      className="btn btn-outline-secondary"
                    >
                      Close
                    </button>
                  )}
                  {selectedTableId !== 1 && (
                    <>
                      {authrztn.includes("ExpensesType2-Edit") && (
                        <>
                          {isArchive ? null : !isEditing ? (
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
                              <Button type="submit" variant="primary">
                                Update
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </>
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

export default Expenses2;
