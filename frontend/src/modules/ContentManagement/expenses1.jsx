import React, { useState, useEffect } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import DataTable from "react-data-table-component";
import swal from "sweetalert";
import "../../assets/css/style.css";
import { customStyles } from "../../assets/table-style";
// import { customStyles } from "../styles/table-style";
import { Plus, FadersHorizontal, MagnifyingGlass } from "@phosphor-icons/react";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { format } from "date-fns";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
const Expenses1 = ({ authrztn }) => {
  const [validated, setValidated] = useState(false);
  const [showModalExpense, setShowModalExpense] = useState(false);
  const [showUpdatedModalExpenses, setShowModalUpdateExpenses] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expensesTypeOne, setExpensesTypeOne] = useState("");
  const [description, setDescription] = useState("");
  const [expensesId, setExpensesId] = useState("");
  const [expensesOneData, setExpensesOneData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [filterStatus, setFilterStatus] = useState("Active");
  const [isArchive, setIsArchive] = useState(false);
  const handleCloseExpenseModal = () => setShowModalExpense(false);
  const handleShowExpenseModal = () => setShowModalExpense(true);

  const [paginationUrl, setPaginationUrl] = useState(
    `${BASE_URL}/expenseone/getPaginatedExpensesOne`
  );

  const userLoggedID = useDecodeToken();

  const handleClose = () => {
    setShowModalUpdateExpenses(false);
  };

  const handleFilterStatus = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields.",
      });
    } else {
      axios
        .post(BASE_URL + "/expenseone/create", {
          expensesTypeOne,
          description,
          userLoggedID,
        })
        .then((response) => {
          if (response.status === 200) {
            swal({
              title: "Expense Type Added Successfully!",
              text: "The new expense type has been added successfully.",
              icon: "success",
              button: "OK",
            }).then(() => {
              setShowModalExpense(false);
              reloadExpensesOne();
              setExpensesTypeOne("");
              setDescription("");
              setValidated(false);
            });
          } else if (response.status === 201) {
            swal({
              title: "Expense Type Already Exists",
              text: "Please input a new expenses.",
              icon: "error",
            });
          }
        });
    }
    setValidated(true);
  };

  const handleFormUpdate = async (e) => {
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
        title: "Update this Expenses?",
        text: "Are you sure you want to update",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .put(`${BASE_URL}/expenseone/updateExpenses1`, {
              expensesId,
              expensesTypeOne,
              description,
              userLoggedID,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  title: "Expense Type updated successfully",
                  text: "",
                  icon: "success",
                  successMode: true,
                }).then(() => {
                  handleCloseUpdateExpensesModal();
                  reloadExpensesOne();
                });
              } else if (res.status === 201) {
                swal({
                  title: "Expense Type already exist",
                  text: "Please input another expenses name",
                  icon: "error",
                  dangerMode: true,
                });
              } else {
                swal({
                  title: "Something Went Wrong",
                  text: "Please contact your support immediately",
                  icon: "error",
                  dangerMode: true,
                }).then(() => {
                  handleCloseUpdateExpensesModal();
                  reloadExpensesOne();
                });
              }
            });
        }
      });
    }
    setValidated(true);
  };

  const handleUnarchive = async () => {
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
            `${BASE_URL}/expenseone/unarchiveExpense`,
            {
              expensesId,
              userLoggedID,
            }
          );

          if (response.status === 200) {
            swal({
              title: "Expense Type Unarchived Successfully!",
              text: "The expense type has been successfully unarchived.",
              icon: "success",
              button: "OK",
            }).then(() => {
              handleCloseUpdateExpensesModal();
              reloadExpensesOne();
            });
          }
        } catch (err) {
          console.log(err);
        }
      }
    });
  };

  const deleteExpensesRow = async () => {
    swal({
      title: "Confirm Archive",
      text: "Are you sure you want to archive this expenses?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          const response = await axios.delete(
            BASE_URL + `/expenseone/deleteExpenseOne/`,
            { data: { expensesId, userLoggedID } }
          );
          if (response.status === 200) {
            swal({
              title: "Expense Type Archived Successfully!",
              text: "The expense type has been successfully archived.",
              icon: "success",
              button: "OK",
            }).then(() => {
              handleCloseUpdateExpensesModal();
              reloadExpensesOne();
            });
          } else if (response.status === 202) {
            swal({
              icon: "error",
              title: "Deletion Prohibited",
              text: "You cannot delete an expense type one that is in use.",
            });
          } else {
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact our support team for assistance.",
            });
          }
        } catch (err) {
          console.log(err);
        }
      }
    });
  };

  const pagination = useServerPagination(paginationUrl, 10);

  const reloadExpensesOne = async () => {
    setPaginationUrl(`${BASE_URL}/expenseone/getExpensesOneForFilter`);
    pagination.updateParams({
      filterStatus,
      filterColumn,
      searchText,
    });
    setIsLoading(false);
    // try {
    //   const res = await axios.get(
    //     `${BASE_URL}/expenseone/getExpensesOneForFilter`,
    //     {
    //       params: {
    //         filterStatus,
    //         filterColumn,
    //         searchText,
    //       },
    //     }
    //   );
    //   setExpensesOneData(res.data);
    //   setIsLoading(false);
    // } catch (error) {
    //   console.error(error);
    // }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadExpensesOne();
    }, 500);
    return () => clearTimeout(timer);
  }, [filterStatus, filterColumn, searchText]);

  //   useEffect(() => {
  //     if (pagination.data) {
  //       setExpensesOneData(pagination.data);
  //     }
  //   }, [pagination.data]);

  const handleCloseUpdateExpensesModal = () => {
    setShowModalExpense(false);
    setShowModalUpdateExpenses(false);
    setValidated(false);
    setExpensesTypeOne("");
    setDescription("");
    setExpensesId("");
  };

  const handleUpdateModal = async (data) => {
    setShowModalUpdateExpenses(true);
    setExpensesId(data.expenses_one_id);
    setExpensesTypeOne(data.expenses_type_one);
    setDescription(data.description);
    setIsArchive(data.isArchive);
  };

  function formatDate(datetime) {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(datetime).toLocaleString("en-US", options);
  }

  const columns = [
    {
      name: "Expense Type",
      selector: (row) => row.expenses_type_one,
    },
    {
      name: "Description",
      selector: (row) => row.description || "--",
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredExpsensesData = expensesOneData.filter(
    (item) =>
      item.expenses_type_one
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatDate(item.createdAt)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

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
        ) : authrztn.includes("ExpensesType1-View") ? (
          <>
            <div className="expenses-content">
              <div className="row mb-3">
                <div className="col-6 title-custom">
                  <span className="fs-3">EXPENSE TYPE</span>
                </div>
                <div className="col-6">
                  {authrztn.includes("ExpensesType1-Add") && (
                    <button
                      className="float-end btn btn-primary d-flex align-items-center title-button"
                      onClick={handleShowExpenseModal}
                    >
                      {/* <Plus size={32} color="#f2f2f2" />  */}
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
                      onChange={handleFilterStatus}
                    >
                      <option value="All">All</option>
                      <option value="Archive">Archive</option>
                      <option value="Active" selected>
                        Active
                      </option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row mb-3">
                {/* <div className="col-12">
                  <div class="input-group mb-3 border border-light border-radius-2">
                    <span
                      className="input-group-text bg-body"
                      id="basic-addon2"
                    >
                      <MagnifyingGlass size={20} color="#969696" />
                    </span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder={`  Search`}
                      onChange={handleSearchChange}
                    />
                    <span
                      className="input-group-text bg-body"
                      id="basic-addon2"
                    >
                      <FadersHorizontal size={32} />
                    </span>
                  </div>
                </div> */}
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
                          filterColumn === "expenses_type_one" ? "active" : ""
                        }`}
                        onClick={() => setFilterColumn("expenses_type_one")}
                      >
                        Expense Type
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

              {/* <DataTable
                columns={columns}
                data={expensesOneData}
                customStyles={customStyles}
                onRowClicked={handleUpdateModal}
                className="dataTable"
              /> */}
              <div className="container-fluid">
                <div className="table-responsive data-table scrollable-contents">
                  <table className="table table-hover table-responsive ">
                    <thead className="bg-light">
                      <tr>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4" }}
                        >
                          EXPENSE TYPE
                          <i className="fas fa-sort ms-1"></i>
                        </th>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4" }}
                        >
                          DESCRIPTION
                          <i className="fas fa-sort ms-1"></i>
                        </th>
                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4" }}
                        >
                          DATE CREATED
                          <i className="fas fa-sort ms-1"></i>
                        </th>

                        <th
                          className="text-muted text-center"
                          style={{ backgroundColor: "#EBEFF4" }}
                        >
                          STATUS
                          <i className="fas fa-sort ms-1"></i>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagination.loading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div className="d-flex justify-content-center align-items-center">
                              <div
                                className="spinner-border text-primary"
                                role="status"
                              >
                                <span className="visually-hidden">
                                  Loading...
                                </span>
                              </div>
                              <span className="ms-2">Loading data...</span>
                            </div>
                          </td>
                        </tr>
                      ) : pagination.error ? (
                        <tr>
                          <td
                            colSpan="7"
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
                          <td colSpan="4" className="text-center py-4">
                            <div className="d-flex flex-column align-items-center">
                              <span>No data available</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pagination.data.map((item, index) => {
                          return (
                            <tr
                              onClick={() => handleUpdateModal(item)}
                              style={{
                                cursor: "pointer",
                              }}
                              key={item.id}
                            >
                              <td className="text-center">
                                {item.expenses_type_one}
                              </td>
                              <td className="text-center">
                                {item.description || "--"}
                              </td>
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
                              <td
                                className="text-center"
                                style={{
                                  color:
                                    item.isArchive === false
                                      ? "#3B9F3F"
                                      : "#767676",
                                  padding: "5px 10px",
                                  borderRadius: "5px",
                                  textTransform: "uppercase",
                                  fontWeight: "bold",
                                }}
                              >
                                {item.isArchive === false
                                  ? "Active"
                                  : "Archive"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls {...pagination} />
              </div>
            </div>
          </>
        ) : (
          <div className="no-access">
            <img src={NoAccess} alt="NoAccess" className="no-access-img" />
            <h3>You don't have access to this function.</h3>
          </div>
        )}
      </div>

      <Modal show={showModalExpense} onHide={handleCloseExpenseModal} size="lg">
        <Form noValidate validated={validated} onSubmit={handleFormSubmit}>
          <Modal.Header closeButton>
            <h2>Create Expenses</h2>
          </Modal.Header>
          <Modal.Body>
            <div className="row mt-3">
              <div className="col-6">
                <Form.Group controlId="exampleForm.ControlInput1">
                  <Form.Label className="fs-5">
                    EXPENSES TYPE NAME <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    required
                    type="text"
                    onChange={(e) => setExpensesTypeOne(e.target.value)}
                    value={expensesTypeOne}
                    className="p-3"
                    placeholder="Expenses Type"
                  />
                </Form.Group>
              </div>
              <div className="col-6"></div>
            </div>

            <div className="row mt-3">
              <div className="">
                <Form.Group controlId="exampleForm.ControlInput1">
                  <Form.Label className="fs-5">DESCRIPTION</Form.Label>
                  <Form.Control
                    onChange={(e) => setDescription(e.target.value)}
                    as="textarea"
                    rows={3}
                    style={{
                      fontSize: "16px",
                      height: "200px",
                      maxHeight: "200px",
                      resize: "none",
                      overflowY: "auto",
                    }}
                    value={description}
                    placeholder="Enter Remarks"
                  />
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              className="btn btn-outline-secondary"
              variant="secondary"
              onClick={handleCloseExpenseModal}
            >
              Close
            </button>
            <Button type="submit" variant="primary">
              Submit
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showUpdatedModalExpenses}
        onHide={handleCloseUpdateExpensesModal}
        size="lg"
      >
        <Form noValidate validated={validated} onSubmit={handleFormUpdate}>
          <Modal.Header closeButton>
            <h2>Update Expenses</h2>
          </Modal.Header>
          <Modal.Body>
            <div className="row mt-3">
              <div className="col-6">
                <Form.Group controlId="exampleForm.ControlInput1">
                  <Form.Label className="fs-5">
                    EXPENSES TYPE NAME
                    <span className="text-danger ps-1">*</span>
                  </Form.Label>
                  <Form.Control
                    className="p-3"
                    required
                    type="text"
                    disabled={isArchive}
                    readOnly={
                      expensesId === "11111111-1111-1111-1111-111111111111"
                    }
                    onChange={(e) => setExpensesTypeOne(e.target.value)}
                    value={expensesTypeOne}
                  />
                </Form.Group>
              </div>
              <div className="col-6"></div>
            </div>

            <div className="row mt-3">
              <div className="">
                <Form.Group controlId="exampleForm.ControlInput1">
                  <Form.Label className="fs-5">DESCRIPTION</Form.Label>
                  <Form.Control
                    onChange={(e) => setDescription(e.target.value)}
                    as="textarea"
                    rows={3}
                    style={{
                      fontSize: "16px",
                      height: "200px",
                      maxHeight: "200px",
                      resize: "none",
                      overflowY: "auto",
                    }}
                    maxLength={50}
                    disabled={isArchive}
                    readOnly={
                      expensesId === "11111111-1111-1111-1111-111111111111"
                    }
                    value={description}
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
            {expensesId !== 1 && expensesId !== 2 && (
              <>
                {authrztn.includes("ExpensesType1-Delete") && (
                  <>
                    {isArchive ? (
                      <>
                        <Button variant="danger" onClick={handleUnarchive}>
                          Unarchive
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="danger" onClick={deleteExpensesRow}>
                          Archive
                        </Button>
                      </>
                    )}
                  </>
                )}

                {authrztn.includes("ExpensesType1-Edit") && (
                  <>
                    {isArchive ? null : (
                      <>
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
    </>
  );
};

export default Expenses1;
