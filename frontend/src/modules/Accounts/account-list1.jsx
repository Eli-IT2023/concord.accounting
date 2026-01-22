import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import { Nav, Tab, Row, Col, Form, Button, Modal } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import swal from "sweetalert";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/global/table-style";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";

const AccountList1 = ({ authrztn }) => {
  const [activeTab, setActiveTab] = useState(1);
  const [subject2name, setSubject2name] = useState("");
  const [subject2type, setSubject2type] = useState("Bank");
  const [subjectList, setSubjectList] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subject3List, setSubject3List] = useState([]);
  const [currencyList, setCurrencyList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSubject2Modal, setShowSubject2Modal] = useState(false);

  const handleShowSubject2Modal = () => {
    setShowSubject2Modal(true);
  };

  const handleCloseSubject2Modal = () => {
    setShowSubject2Modal(false);
    setIsEditing(false);
    setSubject2name("");
    setSubject2type("Bank");
  };

  const subject3ListDataTable = subject3List?.filter(
    (item) => item.subjectId === selectedSubject
  );

  const userLoggedID = useDecodeToken();
  // New subject3 state
  const [newSubject3, setNewSubject3] = useState({
    account: "",
    basedCurrency: "",
    amount: "0",
  });

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
          account_selected: "Account-List",
        },
      })
      .then((res) => {
        setSubjectList(res.data);

        // Auto-select the first subject if no subject is currently selected
        if (res.data.length > 0 && !selectedSubject) {
          const firstSubject = res.data[0];
          setSelectedSubject(firstSubject.id);
          setActiveTab(firstSubject.id);

          // Update URL params to reflect the selection
          setSearchParams((prev) => {
            prev.set("subject2", firstSubject.id);
            return prev;
          });
        }

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
    }));
    setSubject3List(modifySubject3List);
  }, [pagination.data]);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     reloadData();
  //     reloadDataSubject3();
  //   }, 0);
  //   return () => clearTimeout(timer);
  // }, [selectedSubject]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Only reload Subject 3 data if we have a selected subject
      if (selectedSubject) {
        reloadDataSubject3();
      }
    }, 0);
    return () => clearTimeout(timer);

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  // useEffect(() => {
  //   setActiveTab(searchParams.get("subject2"));
  //   setSelectedSubject(searchParams.get("subject2"));

  //   const perPageCount = Number(searchParams.get("items-shown"));
  //   const validOptions = [10, 25, 50, 100];
  //   const itemsPerPage = validOptions.find((opt) => perPageCount <= opt) || 10;

  //   pagination.changeItemsPerPage(Number(itemsPerPage));
  //   reloadCurrency();
  // }, []);

  useEffect(() => {
    // Check if there's a subject2 in URL params
    const urlSubject2 = searchParams.get("subject2");

    if (urlSubject2) {
      // If URL has subject2, use it
      setActiveTab(urlSubject2);
      setSelectedSubject(urlSubject2);
    }

    // Setup pagination
    const perPageCount = Number(searchParams.get("items-shown"));
    const validOptions = [10, 25, 50, 100];
    const itemsPerPage = validOptions.find((opt) => perPageCount <= opt) || 10;
    pagination.changeItemsPerPage(Number(itemsPerPage));

    // Load initial data
    reloadCurrency();

    reloadData(); // This will auto-select first subject if none is selected
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadDataSubject3();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const updateSubject = async () => {
    try {
      if (subject2name === "") {
        swal({
          title: "Oops!",
          text: "Please enter a subject name",
          icon: "error",
          timer: 2000,
        });
        return;
      }

      const result = await swal({
        title: "Are you sure?",
        text: "Once submitted, it will update the subject",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      });

      if (result) {
        const res = await axios.put(
          `${BASE_URL}/accountListSub/updateSubject/${selectedSubject}`,
          {
            subject2name: subject2name,
            subject2type: subject2type,
            module_type: "Account-List",
            userLoggedID,
          }
        );

        if (res.status === 200) {
          swal({
            title: "Success",
            text: "Subject updated successfully",
            icon: "success",
            timer: 2000,
          }).then(() => {
            reloadData();
            handleCloseSubject2Modal();
          });
        } else if (res.status === 201 || res.status === 202) {
          swal({
            title: "Oops!",
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
        swal("Subject not updated");
      }
    } catch (error) {
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
        timer: 2000,
      });
      console.error("Error updating subject:", error);
    }
  };

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
          module_type: "Account-List",
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
            handleCloseSubject2Modal(); // Change this from clearInput() to handleCloseSubject2Modal()
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
        module_type: "Account-List",
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
    setSubject2name(subject.subject_name);
    setSubject2type(subject.subject_type);
    setShowSubject2Modal(true); // Add this line to open the modal
  };

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

          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Subject 2 Deleted",
              text: "Subject 2 has been deleted successfully.",
            }).then(() => {
              reloadDataSubject3();
              reloadData();
            });
          } else if (res.status === 202) {
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

          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Subject 3 Deleted",
              text: "Subject 3 has been deleted successfully.",
            }).then(() => {
              reloadDataSubject3();
              reloadData();
            });
          } else if (res.status === 202) {
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
    },
    {
      name: "Based Currency",
      selector: (row) => row.basedCurrency,
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <>
            {authrztn.includes("AccountingList-Edit") && (
              <>
                <Link
                  to={`/accounts/view-accountlist/${row.id}?subject2=${selectedSubject}&items-shown=${pagination.itemsPerPage}`}
                  className="btn btn-outline-primary"
                  state={{ accList: true }}
                >
                  View
                </Link>
              </>
            )}

            {authrztn.includes("AccountingList-Delete") && (
              <>
                <button
                  className="btn btn-outline-danger ms-2"
                  onClick={() => handleDeleteSubject3(row.id)}
                >
                  Delete
                </button>
              </>
            )}
          </>
        );
      },
    },
  ];

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
      ) : authrztn.includes("AccountingList-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between mb-5">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Account List</span>
            </div>
          </div>
          <Tab.Container
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
          >
            <Row>
              <Col sm={3}>
                <div className="d-flex justify-content-between align-items-center p-2">
                  <span style={{ fontSize: "1.5rem", fontWeight: 500 }}>
                    Subject 2
                  </span>
                  {authrztn.includes("AccountingList-Add") && (
                    <i
                      className="fa-solid fa-plus fs-5"
                      style={{ cursor: "pointer" }}
                      onClick={handleShowSubject2Modal}
                      title="Add New Subject"
                    ></i>
                  )}
                </div>
                <Nav variant="pills" className="flex-column mt-4 mb-2">
                  {subjectList.map((subject) => (
                    <Nav.Item
                      key={subject.id}
                      className="d-flex flex-row align-items-center justify-content-between"
                    >
                      <Nav.Link
                        onClick={() => {
                          setSelectedSubject(subject.id);
                          setSearchParams((prev) => {
                            prev.set("subject2", subject.id);
                            return prev;
                          });
                          reloadDataSubject3();
                        }}
                        eventKey={subject.id}
                        className="w-100"
                      >
                        {subject.subject_name}
                      </Nav.Link>
                      {/* Edit Button */}
                      {authrztn.includes("AccountingList-Edit") && (
                        <i
                          className="fa-solid fa-edit mx-2 fs-5"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleEditSubject(subject)}
                        ></i>
                      )}
                      {authrztn.includes("AccountingList-Delete") && (
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
                    {authrztn.includes("AccountingList-Add") &&
                      selectedSubject && (
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
                                  {authrztn.includes("AccountingList-Edit") && (
                                    <Link
                                      to={`/accounts/view-accountlist/${item.id}`}
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

              <Col sm={3}>
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
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
      <Modal show={showModal} onHide={handleClose} backdrop="static" size="lg">
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
                    setNewSubject3({ ...newSubject3, account: e.target.value })
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

      {/* New Subject 2 Modal */}
      <Modal
        show={showSubject2Modal}
        onHide={handleCloseSubject2Modal}
        backdrop="static"
        size="md"
      >
        <Modal.Header className="border-0">
          <Modal.Title>
            {isEditing ? "Edit Subject 2" : "Add New Subject 2"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container">
            <div className="row">
              <div className="col-12 mb-3">
                <Form.Label>
                  Subject Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  value={subject2name}
                  onChange={(e) => setSubject2name(e.target.value)}
                  type="text"
                  placeholder="Enter Subject Name"
                  required
                />
              </div>
              <div className="col-12 mb-3">
                <Form.Label>
                  Subject Type <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={subject2type}
                  onChange={(e) => setSubject2type(e.target.value)}
                  required
                >
                  <option value="Bank">Bank</option>
                  <option value="Cash">Cash</option>
                </Form.Select>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={handleCloseSubject2Modal}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={isEditing ? updateSubject : addNewSubject}
            disabled={!subject2name}
          >
            {isEditing ? "Update" : "Add"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AccountList1;
