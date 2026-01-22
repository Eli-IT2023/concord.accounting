import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import {
  Nav,
  Tab,
  Row,
  Col,
  Table,
  Form,
  Button,
  Modal,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import swal from "sweetalert";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/global/table-style";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";

const Liabilities1 = ({ authrztn, roleType }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [subject2name, setSubject2name] = useState("");
  const [subject2type, setSubject2type] = useState("Bank");
  const [subjectList, setSubjectList] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subject3List, setSubject3List] = useState([]);
  const [currencyList, setCurrencyList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const subject3ListDataTable = subject3List.filter(
    (item) => item.subjectId === selectedSubject
  );
  const [isLoading, setIsLoading] = useState(true);
  // New subject3 state
  const [newSubject3, setNewSubject3] = useState({
    account: "",
    basedCurrency: "",
    amount: "0",
  });
  const userLoggedID = useDecodeToken();

  // Modal state
  const [showModal, setShowModal] = useState(false);

  const handleShow = (subjectId) => {
    setSelectedSubject(subjectId);
    console.log("Selected Subject 2 ID:", subjectId);

    // Find the selected subject from the subjectList
    const selectedSubject2 = subjectList.find(
      (subject) => subject.id === subjectId
    );
    if (selectedSubject2) {
      console.log("Selected Subject 2 Name:", selectedSubject2.subject_name);
    }

    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setNewSubject3({ account: "", basedCurrency: "", amount: "0" });
  };

  const reloadCurrency = () => {
    axios.get(BASE_URL + "/currency/fetchCurrency").then((res) => {
      setCurrencyList(res.data);
    });
  };

  const clearInput = () => {
    setSubject2name("");
    setSubject2type("Bank");
  };

  const reloadData = () => {
    axios
      .get(BASE_URL + "/accountListSub/getSubject", {
        params: {
          account_selected: "Liabilities Account",
        },
      })
      .then((res) => {
        setSubjectList(res.data);
        setIsLoading(false);
      });
  };

  const pagination = useServerPagination(
    BASE_URL + "/accountListSub/getSubject3ForFilter",
    10
  );

  const reloadDataSubject3 = () => {
    if (!selectedSubject) return;

    pagination.updateParams({
      subjectId: selectedSubject,
      searchText,
    });
    setIsLoading(false);

    // axios
    //   .get(BASE_URL + "/accountListSub/getSubject3ForFilter", {
    //     params: {
    //       subjectId: selectedSubject,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     const modifySubject3List = res.data.map((item) => ({
    //       id: item.id,
    //       subjectId: item.account_list_base_sub_id,
    //       account: item.account_name,
    //       amount: item.amount,
    //       basedCurrency: item.currency.currency_name,
    //       investment_amount: item.investment_amount,
    //     }));
    //     setSubject3List(modifySubject3List);
    //     setIsLoading(false);
    //   });
  };

  useEffect(() => {
    const modifySubject3List = pagination.data.map((item) => ({
      id: item.id,
      subjectId: item.account_list_base_sub_id,
      account: item.account_name,
      amount: item.amount,
      basedCurrency: item.currency.currency_name,
      investment_amount: item.investment_amount,
    }));
    setSubject3List(modifySubject3List);
  }, [pagination.data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      reloadData();
      reloadCurrency();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    reloadDataSubject3();
  }, [selectedSubject, searchText]);

  const addNewSubject = async () => {
    try {
      if (subject2name === "") {
        swal({
          title: "Oppss!",
          text: "Please enter a subject",
          icon: "error",
          timer: 2000,
        });
        return;
      }

      const result = await swal({
        title: "Are you sure?",
        text: "Once submitted, it will add new subject",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      });

      if (result) {
        const res = await axios.post(BASE_URL + "/accountListSub/addSubject", {
          subject: subject2name,
          subject_type: subject2type,
          module_type: "Liabilities Account",
          userLoggedID,
        });

        if (res.status === 200) {
          swal({
            title: "Success",
            text: "Subject added successfully",
            icon: "success",
            timer: 2000,
          }).then(() => {
            reloadData();
            clearInput();
          });
        } else if (res.status === 201) {
          swal({
            title: "Oppss!",
            text: "Subject already exists",
            icon: "error",
            timer: 2000,
          });
        } else {
          swal({
            title: "Something went wrong",
            text: "Please contact your support immediately",
            icon: "error",
            timer: 2000,
          });
        }
      } else {
        swal("Subject not added");
      }
    } catch (error) {
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
        timer: 2000,
      });
      console.error("Error adding new subject:", error);
    }
  };

  const handleAddNewSubject3 = async () => {
    if (!newSubject3.account || !newSubject3.basedCurrency) {
      swal({
        title: "Oops!",
        text: "Please fill in all required fields",
        icon: "error",
        timer: 2000,
      });
      return;
    }

    const newSubject = {
      subjectId: selectedSubject,
      isNew: true,
      account: newSubject3.account,
      amount: "0",
      basedCurrency: newSubject3.basedCurrency,
    };

    try {
      // Make the API call with a single new subject
      const res = await axios.post(BASE_URL + "/accountListSub/addSubject3", {
        subject3List: [newSubject],
        module_type: "Liabilities Account",
        userLoggedID,
      });

      if (res.status === 200) {
        swal({
          title: "Success",
          text: "Subject 3 added successfully",
          icon: "success",
          timer: 2000,
        }).then(() => {
          reloadDataSubject3();
          setNewSubject3({ account: "", basedCurrency: "", amount: "0" });
          handleClose();
        });
      } else if (res.status === 201) {
        swal({
          title: "Oops!",
          text: "Subject already exists",
          icon: "warning",
          timer: 2000,
        });
      } else {
        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          timer: 2000,
        });
      }
    } catch (error) {
      console.error("Error adding new subject3:", error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
        timer: 2000,
      });
    }
  };

  const [isEditing, setIsEditing] = useState(false);

  const handleEditSubject = (subject) => {
    setIsEditing(true);
    setSelectedSubject(subject.id);
    setSubject2name(subject.subject_name); // Pre-fill with selected subject data
    setSubject2type(subject.subject_type); // Assuming subject has a type field
  };

  const updateSubject = async (e) => {
    e.preventDefault();
    console.log(`${BASE_URL}/accountListSub/updateSubject/${selectedSubject}`);

    try {
      const response = await axios.put(
        `${BASE_URL}/accountListSub/updateSubject/${selectedSubject}`,
        {
          subject2name: subject2name,
          subject2type: subject2type,
          module_type: "Liabilities Account",
          userLoggedID,
        }
      );

      if (response.status === 200) {
        swal({
          title: "Update successful!",
          text: "The Subject has been updated successfully.",
          icon: "success",
          button: "OK",
        }).then(() => {
          setIsEditing(false);
          setSubject2name("");
          setSubject2type("");
          reloadDataSubject3();
          reloadData();
        });
      } else if (response.status === 202) {
        if (response.data === "Exist") {
          swal({
            icon: "error",
            title: "Subject 2 already exists",
            text: "Please input another Subject Name",
          });
        }
      } else {
        swal({
          icon: "error",
          title: "Something went wrong",
          text: "Please contact our support",
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteSubject3 = async (id) => {
    try {
      swal({
        icon: "warning",
        title: "Confirm Deletion",
        text: "Are you sure you want to delete this subject?",
        buttons: true,
        dangerMode: true,
      }).then(async (willDelete) => {
        if (willDelete) {
          const res = await axios.delete(
            `${BASE_URL}/accountListSub/deleteSubject3/${id}`,
            {
              data: {
                userLoggedID,
              },
            }
          );

          if (res.status == 200) {
            swal({
              icon: "success",
              title: "Subject 3 Deleted",
              text: "Subject 3 has been deleted successfully.",
            }).then(() => {
              reloadDataSubject3();
              reloadData();
            });
          } else if (res.status == 202) {
            swal({
              icon: "error",
              title: "Subject 3 cannot delete",
              text: "Subject 3 already has a transaction.",
            });
          }
        } else {
          swal.close();
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const subject3Column = [
    {
      name: "Account",
      selector: (row) => row.account,
    },
    {
      name: "Balance",
      selector: (row) =>
        row.amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      omit: !roleType?.includes("Management"),
    },
    // {
    //   name: "To Pay",
    //   selector: (row) =>
    //     row.investment_amount.toLocaleString("en-US", {
    //       minimumFractionDigits: 2,
    //       maximumFractionDigits: 2,
    //     }),
    // },
    {
      name: "Based Currency",
      selector: (row) => row.basedCurrency,
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <>
            {authrztn.includes("Liability-Edit") && (
              <Link
                to={`/accounting/view-liabilityAccount/${row.id}`}
                className="btn btn-outline-primary"
                state={{ liability: true }}
              >
                Edit
              </Link>
            )}

            {authrztn.includes("Liability-Delete") && (
              <button
                className="btn btn-outline-danger ms-2"
                onClick={() => handleDeleteSubject3(row.id)}
              >
                Delete
              </button>
            )}
          </>
        );
      },
    },
  ];

  const handleDeleteSubject2 = async (id) => {
    try {
      swal({
        icon: "warning",
        title: "Confirm Deletion",
        text: "Are you sure you want to delete this subject?",
        buttons: true,
        dangerMode: true,
      }).then(async (willDelete) => {
        if (willDelete) {
          const res = await axios.delete(
            `${BASE_URL}/accountListSub/deleteSubject2/${id}`,
            {
              data: {
                userLoggedID,
              },
            }
          );

          if (res.status == 200) {
            swal({
              icon: "success",
              title: "Subject 2 Deleted",
              text: "Subject 2 has been deleted successfully.",
            }).then(() => {
              reloadDataSubject3();
              reloadData();
            });
          } else if (res.status == 202) {
            swal({
              icon: "error",
              title: "Subject 2 cannot delete",
              text: "Subject 2 is currently in use",
            });
          }
        } else {
          swal.close();
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

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
      ) : authrztn.includes("Liability-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between mb-5">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Liability Account</span>
            </div>
          </div>
          <Tab.Container
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
          >
            <Row>
              <Col sm={3}>
                <span
                  style={{ fontSize: "1.5rem", fontWeight: 500 }}
                  className="p-2"
                >
                  Subject 2
                </span>
                <Nav variant="pills" className="flex-column mt-4 mb-2">
                  {subjectList.map((subject) => (
                    <Nav.Item
                      key={subject.id}
                      className="d-flex flex-row align-items-center justify-content-between"
                    >
                      <Nav.Link
                        onClick={() => {
                          setSelectedSubject(subject.id);
                          reloadDataSubject3();
                        }}
                        eventKey={subject.id}
                        className="w-100"
                      >
                        {subject.subject_name}
                      </Nav.Link>
                      {/* Edit Button */}
                      {authrztn.includes("Liability-Edit") && (
                        <i
                          className="fa-solid fa-edit mx-2 fs-5"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleEditSubject(subject)}
                        ></i>
                      )}
                      {authrztn.includes("Liability-Delete") &&
                        subject.id !==
                          "33333333-3333-3333-3333-333333333333" && (
                          <i
                            className="fa fa-trash fs-5 text-danger"
                            style={{ cursor: "pointer" }}
                            aria-hidden="true"
                            onClick={() => handleDeleteSubject2(subject.id)}
                          ></i>
                        )}
                    </Nav.Item>
                  ))}
                </Nav>

                <Form.Group className="d-flex flex-row align-items-center justify-content-center mt-3">
                  <Form.Control
                    value={subject2name}
                    onChange={(e) => setSubject2name(e.target.value)}
                    type="text"
                    placeholder="Add New Subject"
                    className="me-2 flex-grow-1"
                    style={{ maxWidth: "200px" }}
                  />
                  <Form.Select
                    value={subject2type}
                    onChange={(e) => setSubject2type(e.target.value)}
                    className="me-2"
                    style={{ width: "auto" }}
                  >
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                  </Form.Select>
                  {authrztn.includes(
                    isEditing ? "Liability-Edit" : "Liability-Add"
                  ) && (
                    <Button
                      onClick={isEditing ? updateSubject : addNewSubject}
                      variant="primary"
                      className="px-4"
                      style={{ marginTop: "-0rem" }}
                    >
                      {isEditing ? "Update" : "Add"}
                    </Button>
                  )}
                </Form.Group>
              </Col>

              <Col sm={6} className="border-end border-start">
                <span
                  style={{ fontSize: "1.5rem", fontWeight: 500 }}
                  className="p-2"
                >
                  Subject 3
                </span>
                <div className="px-3 pt-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                <div className="px-3 pb-3 pt-2 rounded mb-2">
                  <div className="w-100 pb-1 text-end">
                    {authrztn.includes("Liability-Add") && selectedSubject && (
                      <i
                        className="fa-solid fa-plus mx-2 fs-5"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleShow(selectedSubject)}
                      ></i>
                    )}
                  </div>
                  <Tab.Content>
                    <Tab.Pane eventKey={selectedSubject}>
                      {/* <Table
                        hover
                        responsive
                        className="rounded reports-custom-table"
                      >
                        <thead>
                          <tr style={{ backgroundColor: "#f8f9fa" }}>
                            <th>Account</th>
                            <th>Amount</th>
                            <th>Based Currency</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subject3List
                            .filter(
                              (item) => item.subjectId === selectedSubject
                            )
                            .map((item) => (
                              <tr key={item.id}>
                                <td style={{ padding: "15px" }}>
                                  {item.account}
                                </td>
                                <td style={{ padding: "15px" }}>
                                  {item.amount.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td style={{ padding: "15px" }}>
                                  {item.basedCurrency}
                                </td>
                                <td style={{ padding: "15px" }}>
                                  {authrztn.includes("Liability-Edit") && (
                                    <Link
                                      to={`/accounting/view-liabilityAccount/${item.id}`}
                                      className="btn btn-outline-primary"
                                    >
                                      Edit
                                    </Link>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table> */}
                      <DataTable
                        columns={subject3Column}
                        data={subject3ListDataTable}
                        customStyles={customStyles}
                        className="dataTable"
                      />
                      <PaginationControls {...pagination} />
                    </Tab.Pane>
                  </Tab.Content>
                </div>
              </Col>

              <Col
                sm={3}
                className={roleType?.includes("Management") ? "" : "d-none"}
              >
                <span
                  style={{ fontSize: "1.5rem", fontWeight: 500 }}
                  className="p-2"
                >
                  Total Amount
                </span>
                <Nav className="flex-column mt-4 mb-2">
                  {subjectList.map((item) => (
                    <Nav.Item
                      key={item.id}
                      className={`p-1 rounded border-bottom ${
                        selectedSubject === item.id ? "bg-warning" : ""
                      }`}
                    >
                      <h6 className="text-dark">
                        ₱{" "}
                        {item.totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </h6>
                    </Nav.Item>
                  ))}
                </Nav>
              </Col>
            </Row>
          </Tab.Container>

          <Modal
            show={showModal}
            onHide={handleClose}
            backdrop="static"
            size="lg"
          >
            <Modal.Header className="border-0">
              <Modal.Title>Add Subject 3</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {console.log("Modal opened for Subject 2 ID:", selectedSubject)}
              <div className="container">
                <div className="row">
                  <div className="col-12 mb-3">
                    <Form.Label>Selected Subject 2:</Form.Label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        subjectList.find(
                          (subject) => subject.id === selectedSubject
                        )?.subject_name || ""
                      }
                      readOnly
                    />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <Form.Label>
                      Account Name <span className="text-danger">*</span>
                    </Form.Label>
                    <input
                      type="text"
                      name="account"
                      id="account"
                      className="form-control p-2"
                      placeholder="Enter Account Name"
                      value={newSubject3.account}
                      onChange={(e) =>
                        setNewSubject3({
                          ...newSubject3,
                          account: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <Form.Label>
                      Currency <span className="text-danger">*</span>
                    </Form.Label>
                    <select
                      className="form-select"
                      value={newSubject3.basedCurrency}
                      onChange={(e) =>
                        setNewSubject3({
                          ...newSubject3,
                          basedCurrency: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="" disabled>
                        Select Currency
                      </option>
                      {currencyList.map((currency) => (
                        <option key={currency.id} value={currency.id}>
                          {currency.currency_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <Form.Label>Amount</Form.Label>
                    <input
                      type="text"
                      className="form-control"
                      value="0"
                      readOnly
                    />
                    <small className="text-muted">
                      Amount is automatically set to 0
                    </small>
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={handleClose}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleAddNewSubject3}
                disabled={!newSubject3.account || !newSubject3.basedCurrency}
              >
                Submit
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
};

export default Liabilities1;
