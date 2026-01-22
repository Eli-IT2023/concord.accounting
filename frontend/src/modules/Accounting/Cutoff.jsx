import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import swal from "sweetalert";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import { useNavigate } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import DatePicker from "react-datepicker";
import CustomDatePickerInput from "../../utils/CustomerDateInput";
import "../../assets/css/style.css";
import { format } from "date-fns";
function Cutoff({ authrztn }) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [toUpdateID, setToUpdateID] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cutoff_name, setCutoff_name] = useState("");
  const [validated, setValidated] = useState(false);
  const [cutoffs, setCutoffs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCutoffs, setSelectedCutoffs] = useState([]);
  const [showModalEarningsName, setShowModalEarningsName] = useState(false);
  const [earningsName, setEarningsName] = useState("");
  const [searchText, setSearchText] = useState("");

  const userLoggedID = useDecodeToken();
  const handleClose = () => {
    setShow(false);
    setValidated(false);
    setFrom("");
    setTo("");
    setCutoff_name("");
    setShowUpdate(false);
    setShowModalEarningsName(false);
    setEarningsName("");
  };
  const handleShow = () => setShow(true);
  const handleShowUpdate = (id, from, to, name) => {
    setShowUpdate(true);
    setToUpdateID(id);
    setFrom(from);
    setTo(to);
    setCutoff_name(name);
  };

  const handleViewCutoff = (id) => {
    navigate(`/accounting/view-cutoff/${id}`);
  };

  const getCutoffs = async () => {
    try {
      await axios
        .get(`${BASE_URL}/cutoff/getCutoffsForFilter`, {
          params: {
            searchText,
          },
        })
        .then((res) => {
          setCutoffs(res.data);
          setIsLoading(false);
          // console.log(res.data);
        });
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     getCutoffs();
  //   }, 1500);
  //   return () => clearTimeout(timer);
  // }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      getCutoffs();
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handlePostCutoff = (id) => {
    swal({
      title: "Confirm Action",
      text: "Are you sure you want to post this cutoff period?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        try {
          axios
            .post(`${BASE_URL}/cutoff/postCutoff`, {
              params: { id, userLoggedID },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  icon: "success",
                  title: "Success",
                  text: "Cutoff posted successfully",
                  timer: 2000,
                  button: false,
                }).then(() => {
                  handleClose();
                  getCutoffs();
                });
              } else {
                swal({
                  icon: "error",
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  timer: 2000,
                  button: false,
                });
              }
            });
        } catch (error) {
          console.log(error);
        }
      }
    });
  };

  const addNew = (e) => {
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
        title: "Confirm Action",
        text: "Are you sure you want to create a new cutoff period?",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          try {
            axios
              .post(`${BASE_URL}/cutoff/createCutoff`, {
                from: from && format(from, "MMM dd, yyyy"),
                to: to && format(to, "MMM dd, yyyy"),
                cutoff_name,
                userLoggedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    icon: "success",
                    title: "Success",
                    text: "Cutoff created successfully",
                    timer: 2000,
                    button: false,
                  }).then(() => {
                    handleClose();
                    getCutoffs();
                  });
                } else if (res.status === 201) {
                  swal({
                    icon: "error",
                    title: "Oppss!",
                    text: "Date range overlaps with existing cutoff period",
                    timer: 2000,
                    button: false,
                  });
                } else {
                  swal({
                    icon: "error",
                    title: "Something went wrong",
                    text: "Please contact your support immediately",
                    timer: 2000,
                    button: false,
                  });
                }
              })
              .catch((error) => {
                if (error.response && error.response.status === 409) {
                  swal({
                    icon: "error",
                    title: "New Cutoff Creation Failed!",
                    text: error.response.data.message,
                    button: "OK",
                  });
                  return;
                }

                if (error.response && error.response.status === 404) {
                  swal({
                    icon: "error",
                    title: "New Cutoff Creation Failed!",
                    text: error.response.data.message,
                    button: "OK",
                  });
                  return;
                }
              });
          } catch (error) {
            console.log(error);
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact your support immediately",
              timer: 2000,
              button: false,
            });
          }
        }
      });
    }
    setValidated(true);
  };

  const updateCutoff = (e) => {
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
        title: "Confirm Action",
        text: "Are you sure you want to update this cutoff period?",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          try {
            axios
              .post(`${BASE_URL}/cutoff/updateCutoff`, {
                id: toUpdateID,
                from,
                to,
                cutoff_name,
                userLoggedID,
              })
              .then((res) => {
                if (res.status === 200) {
                  swal({
                    icon: "success",
                    title: "Success",
                    text: "Cutoff updated successfully",
                    timer: 2000,
                    button: false,
                  }).then(() => {
                    handleClose();
                    getCutoffs();
                  });
                } else if (res.status === 201) {
                  swal({
                    icon: "error",
                    title: "Oppss!",
                    text: "Date range overlaps with existing cutoff period",
                    timer: 2000,
                    button: false,
                  });
                } else {
                  swal({
                    icon: "error",
                    title: "Something went wrong",
                    text: "Please contact your support immediately",
                    timer: 2000,
                    button: false,
                  });
                }
              });
          } catch (error) {
            console.log(error);
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact your support immediately",
              timer: 2000,
              button: false,
            });
          }
        }
      });
    }
    setValidated(true);
  };

  const handleDeleteCutoff = (id) => {
    swal({
      title: "Confirm Action",
      text: "Are you sure you want to delete this cutoff period?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        try {
          axios
            .post(`${BASE_URL}/cutoff/deleteCutoff`, {
              params: { id, userLoggedID },
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  icon: "success",
                  title: "Success",
                  text: "Cutoff deleted successfully",
                  timer: 2000,
                  button: false,
                }).then(() => {
                  handleClose();
                  getCutoffs();
                });
              } else if (res.status === 201) {
                swal({
                  icon: "error",
                  title: "Cutoff is used in Earnings",
                  text: `Please delete the earnings first named "${res.data.message}"`,
                  timer: 2000,
                  button: false,
                });
              } else {
                swal({
                  icon: "error",
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  timer: 2000,
                  button: false,
                });
              }
            })
            .catch((error) => {
              console.log(error);
              swal({
                icon: "error",
                title: "Something went wrong",
                text: "Please contact your support immediately",
                timer: 2000,
                button: false,
              });
            });
        } catch (error) {
          console.log(error);
          swal({
            icon: "error",
            title: "Something went wrong",
            text: "Please contact your support immediately",
            timer: 2000,
            button: false,
          });
        }
      }
    });
  };

  const handleCutoffSelection = (
    cutoffId,
    cutoffName,
    cutoffFrom,
    cutoffTo
  ) => {
    setSelectedCutoffs((prev) => {
      if (prev.some((selected) => selected.value === cutoffId)) {
        return prev.filter((selected) => selected.value !== cutoffId);
      } else {
        return [
          ...prev,
          {
            value: cutoffId,
            label: cutoffName,
            from: cutoffFrom,
            to: cutoffTo,
          },
        ];
      }
    });
  };

  const handleAddRetainedEarnings = (e) => {
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
        title: "Confirm Action",
        text: "Are you sure you want to add this cutoff/s to retained earnings?",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/earnings/createEarnings`, {
              earning_name: earningsName,
              selectedOptionsCutoff: selectedCutoffs,
              userLoggedID,
            })
            .then((res) => {
              if (res.status === 200) {
                swal({
                  icon: "success",
                  title: "Success",
                  text: "Earnings created successfully",
                  timer: 2000,
                  button: false,
                }).then(() => {
                  handleClose();
                  navigate("/accounting/retained-earnings");
                });
              } else if (res.status === 201) {
                swal({
                  icon: "error",
                  title: "Oppss!",
                  text: "Date range overlaps with existing earnings period",
                  timer: 2000,
                  button: false,
                });
              } else {
                swal({
                  icon: "error",
                  title: "Something went wrong",
                  text: "Please contact your support immediately",
                  timer: 2000,
                  button: false,
                });
              }
            });
        }
      });
    }
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      className="form-control p-2 w-100"
      style={{
        cursor: "pointer",
        caretColor: "transparent",
      }}
      onClick={onClick}
      value={value}
      ref={ref}
      placeholder="Select Date"
      required
    />
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
      ) : authrztn.includes("Monthly-View") ? (
        <>
          <div className="w-100 p-2 mb-1 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">CutOff</span>
            </div>
            <div>
              {authrztn.includes("Monthly-Add") &&
                (selectedCutoffs.length > 0 ? (
                  <React.Fragment>
                    <Button
                      variant="warning"
                      onClick={() => setShowModalEarningsName(true)}
                    >
                      Add to Retained Earnings
                    </Button>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Button
                      className="btn d-flex align-items-center title-button"
                      variant="primary"
                      onClick={handleShow}
                    >
                      <i className="bx bx-plus fs-5"></i> Add Cutoff
                    </Button>
                  </React.Fragment>
                ))}
            </div>
          </div>

          <div className="w-100 pt-2 px-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="w-100 p-4">
            <div className="row g-4">
              {cutoffs.map((cutoff) => (
                <div className="col-md-4" key={cutoff.id}>
                  <div
                    className={`card border shadow-sm rounded-3 hover-lift transition-shadow ${
                      selectedCutoffs.some(
                        (selected) => selected.value === cutoff.id
                      )
                        ? "border-primary"
                        : ""
                    }`}
                    onClick={() =>
                      cutoff.isPosted &&
                      cutoff.return_earnings_cutoffs.length === 0 &&
                      handleCutoffSelection(
                        cutoff.id,
                        cutoff.name,
                        cutoff.from,
                        cutoff.to
                      )
                    }
                    style={{
                      cursor:
                        cutoff.isPosted &&
                        cutoff.return_earnings_cutoffs.length === 0
                          ? "pointer"
                          : "not-allowed",
                    }}
                    title={
                      !cutoff.isPosted
                        ? "Not Allowed - Cutoff must be posted first"
                        : !(
                            cutoff.isPosted &&
                            cutoff.return_earnings_cutoffs.length === 0
                          )
                        ? "Not Allowed - Cutoff is already in retained earnings"
                        : ""
                    }
                  >
                    <div className="card-body p-4">
                      {/* Status Badge */}
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-bold text-dark fs-5">
                          {cutoff.name}
                        </span>
                        <span
                          className={`badge ${
                            cutoff.isPosted
                              ? "bg-success text-white"
                              : "bg-danger text-white"
                          } rounded-pill px-3 py-2`}
                        >
                          {cutoff.isPosted ? "POSTED" : "UNPOSTED"}
                        </span>
                        <Dropdown>
                          <Dropdown.Toggle
                            variant="link"
                            className="text-muted no-caret p-0"
                            id="dropdown-basic"
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </Dropdown.Toggle>

                          <Dropdown.Menu className="shadow border-0 rounded-3">
                            <Dropdown.Item
                              onClick={() => handleViewCutoff(cutoff.id)}
                              className="d-flex align-items-center px-3 py-2"
                            >
                              <i className="bi bi-file-earmark-text me-2 text-success"></i>
                              <span className="text-body-secondary">View</span>
                            </Dropdown.Item>
                            {authrztn.includes("Monthly-Edit") && (
                              <Dropdown.Item
                                disabled={cutoff.isPosted}
                                style={{ opacity: cutoff.isPosted ? 0.5 : 1 }}
                                onClick={() =>
                                  handleShowUpdate(
                                    cutoff.id,
                                    cutoff.from,
                                    cutoff.to,
                                    cutoff.name
                                  )
                                }
                                className="d-flex align-items-center px-3 py-2"
                              >
                                <i className="bi bi-pencil me-2 text-warning"></i>

                                <span className="text-body-secondary">
                                  Update
                                </span>
                              </Dropdown.Item>
                            )}
                            {authrztn.includes("Monthly-Approve") && (
                              <Dropdown.Item
                                className="d-flex align-items-center px-3 py-2"
                                disabled={cutoff.isPosted}
                                style={{ opacity: cutoff.isPosted ? 0.5 : 1 }}
                                onClick={(e) => {
                                  if (!cutoff.isPosted) {
                                    handlePostCutoff(cutoff.id);
                                  }
                                }}
                              >
                                <i className="bi bi-check-circle me-2 text-primary"></i>
                                <span className="text-body-secondary">
                                  Post Cutoff
                                </span>
                              </Dropdown.Item>
                            )}
                            <Dropdown.Divider />
                            {authrztn.includes("Monthly-Delete") && (
                              <Dropdown.Item
                                onClick={() => handleDeleteCutoff(cutoff.id)}
                                className="d-flex align-items-center px-3 py-2 text-danger"
                              >
                                <i className="bi bi-trash me-2"></i>
                                <span>Delete</span>
                              </Dropdown.Item>
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>

                      {/* Date Display */}
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <div
                            className="bg-light rounded-3 p-3 text-center"
                            style={{ minWidth: "80px" }}
                          >
                            <i className="bi bi-calendar-range text-primary fs-4 mb-1"></i>
                            <div className="text-primary small fw-medium">
                              Period
                            </div>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex flex-column">
                            <div className="fw-semibold fs-5 text-dark mb-1 text-center">
                              {/* {new Date(cutoff.from).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )} */}
                              {cutoff.from
                                ? format(cutoff.from, "MMM dd, yyyy")
                                : null}
                            </div>
                            <div className="d-flex align-items-center justify-content-center">
                              <div className="border-bottom flex-grow-1 mx-2"></div>
                              <span className="text-muted small px-2">to</span>
                              <div className="border-bottom flex-grow-1 mx-2"></div>
                            </div>
                            <div className="fw-semibold fs-5 text-dark mt-1 text-center">
                              {/* {new Date(cutoff.to).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })} */}
                              {cutoff.to
                                ? format(cutoff.to, "MMM dd, yyyy")
                                : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Modal
            show={show}
            backdrop="static"
            keyboard={false}
            onHide={handleClose}
          >
            <Form noValidate validated={validated} onSubmit={addNew}>
              <Modal.Header closeButton>
                <Modal.Title>Add Cutoff</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="row">
                  <div className="col-sm">
                    <label>Cutoff Name :</label>
                    <input
                      type="text"
                      value={cutoff_name}
                      onChange={(e) => setCutoff_name(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm">
                    <label>From :</label>

                    <div>
                      {/* <DatePicker
                        selected={from}
                        dateFormat="MMM dd, yyyy"
                        onChange={(date) => {
                          setFrom(date);
                        }}
                        className="form-control p-2"
                        maxDate={to}
                        customInput={<CustomInput />}
                      /> */}
                      <DatePicker
                        selected={from}
                        onChange={(date) => setFrom(date)}
                        dateFormat="MMM dd, yyyy"
                        placeholderText="Select date"
                        customInput={<CustomDatePickerInput />}
                        maxDate={to}
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        popperPlacement="bottom"
                        popperProps={{
                          positionFixed: true,
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-sm">
                    <label>To :</label>
                    {/* <input
                      type="date"
                      className="form-control"
                      value={to}
                      required
                      min={from} // Prevent To date being earlier than From date
                      onChange={(e) => setTo(e.target.value)}
                    /> */}
                    <div>
                      {/* <DatePicker
                        selected={to}
                        dateFormat="MMM dd, yyyy"
                        onChange={(date) => {
                          setTo(date);
                        }}
                        className="form-control p-2"
                        minDate={from}
                        customInput={<CustomInput />}
                      /> */}
                      <DatePicker
                        selected={to}
                        onChange={(date) => setTo(date)}
                        dateFormat="MMM dd, yyyy"
                        placeholderText="Select date"
                        customInput={<CustomDatePickerInput />}
                        minDate={from}
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        popperPlacement="bottom"
                        popperProps={{
                          positionFixed: true,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" type="button" onClick={handleClose}>
                  Close
                </Button>
                <Button variant="primary" type="submit">
                  Add
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          <Modal
            show={showUpdate}
            backdrop="static"
            keyboard={false}
            onHide={handleClose}
          >
            <Form noValidate validated={validated} onSubmit={updateCutoff}>
              <Modal.Header closeButton>
                <Modal.Title>Update Cutoff</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="row">
                  <div className="col-sm">
                    <label>Cutoff Name :</label>
                    <input
                      type="text"
                      value={cutoff_name}
                      onChange={(e) => setCutoff_name(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm">
                    <label>From :</label>
                    {/* <input
                      type="date"
                      className="form-control"
                      value={from}
                      required
                      onChange={(e) => setFrom(e.target.value)}
                      max={to} // Prevent From date being later than To date
                    /> */}
                    <div>
                      <DatePicker
                        selected={from}
                        dateFormat="MMM dd, yyyy"
                        onChange={(date) => {
                          setFrom(date);
                        }}
                        className="form-control p-2"
                        maxDate={to}
                        customInput={<CustomInput />}
                      />
                    </div>
                  </div>
                  <div className="col-sm">
                    <label>To :</label>
                    {/* <input
                      type="date"
                      className="form-control"
                      value={to}
                      required
                      min={from} // Prevent To date being earlier than From date
                      onChange={(e) => setTo(e.target.value)}
                    /> */}
                    <div>
                      <DatePicker
                        selected={to}
                        dateFormat="MMM dd, yyyy"
                        onChange={(date) => {
                          setTo(date);
                        }}
                        className="form-control p-2"
                        minDate={from}
                        customInput={<CustomInput />}
                      />
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" type="button" onClick={handleClose}>
                  Close
                </Button>
                <Button variant="primary" type="submit">
                  Update
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          <Modal
            show={showModalEarningsName}
            backdrop="static"
            keyboard={false}
            onHide={handleClose}
          >
            <Form
              noValidate
              validated={validated}
              onSubmit={handleAddRetainedEarnings}
            >
              <Modal.Header closeButton>
                <Modal.Title>Please Add Name First</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="row">
                  <div className="col-sm">
                    <label>Earnings Name :</label>
                    <input
                      type="text"
                      value={earningsName}
                      onChange={(e) => setEarningsName(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" type="button" onClick={handleClose}>
                  Close
                </Button>
                <Button variant="primary" type="submit">
                  Add
                </Button>
              </Modal.Footer>
            </Form>
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
}

export default Cutoff;
