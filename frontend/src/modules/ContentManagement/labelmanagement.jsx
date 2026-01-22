import React, { useState, useEffect } from "react";
import swal from "sweetalert";
// import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { Plus, FadersHorizontal, MagnifyingGlass } from "@phosphor-icons/react";
import { customStyles } from "../../assets/global/table-style";
import DataTable from "react-data-table-component";
import Select from "react-select";
function LabelManagement() {
  const [show, setShow] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [labelName, setLabelName] = useState("");
  const [subLabelName, setSubLabelName] = useState("");
  const [tags, setTag] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [description, setDescription] = useState("");

  const [validated, setValidated] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setShowUpdateModal(false);
    setValidated(false);
    setLabelName("");
    setSubLabelName("");
    setTag([]);
    setAccounts([]);
    setDescription("");
  };

  const reloadTable = () => {
    axios
      .get(BASE_URL + "/label/fetchTable")
      .then((response) => {
        setTableData(response.data);
        setFilteredData(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  };

  useEffect(() => {
    reloadTable();
  }, []);

  console.log(filteredData);

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
        title: "Create this new Label?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/label/createLabel`, {
              labelName,
              subLabelName,
              tags,
              description,
              accounts,
            })
            .then((res) => {
              // console.log(res);
              if (res.status === 200) {
                swal({
                  title: "Success!",
                  text: "Label successfully added.",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                }).then(() => {
                  handleClose();
                  reloadTable();
                });
              } else if (res.status === 201) {
                swal({
                  title: "Label already exist",
                  text: "Please input another label",
                  icon: "error",
                  buttons: true,
                  dangerMode: true,
                });
              } else {
                swal({
                  title: "Something Went Wrong",
                  text: "Please contact your support immediately",
                  icon: "error",
                  buttons: true,
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
        title: "Update this Label?",
        text: "",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((confirmed) => {
        if (confirmed) {
          axios
            .post(`${BASE_URL}/label/updateLabel`, {
              selectedTableId,
              labelName,
              subLabelName,
              tags,
              description,
            })
            .then((res) => {
              // console.log(res);
              if (res.status === 200) {
                swal({
                  title: "Label updated successfully",
                  text: "",
                  icon: "success",
                  buttons: true,
                  dangerMode: true,
                }).then(() => {
                  handleClose();
                  reloadTable();
                });
              } else if (res.status === 201) {
                swal({
                  title: "Label already exist",
                  text: "Please input another label",
                  icon: "error",
                  buttons: true,
                  dangerMode: true,
                });
              } else {
                swal({
                  title: "Something Went Wrong",
                  text: "Please contact your support immediately",
                  icon: "error",
                  buttons: true,
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
    setLabelName(data.label_name);
    setSubLabelName(data.sub_label_name);
    const tags = data.label_tags.map((tagItem) => ({
      value: tagItem.tag,
      label: tagItem.tag,
    }));

    setTag(tags);

    const account = data.label_tags.map((tagItem) => ({
      value: tagItem.tag,
      label: tagItem.tag,
    }));

    setTag(tags);

    setDescription(data.description);
  };

  const handleSearch = (value) => {
    if (value.trim() === "") {
      setFilteredData(tableData);
    } else {
      const filtered = tableData.filter((data) => {
        return (
          (data.label_name?.toString().toLowerCase() || "").includes(value) ||
          (data.sub_label_name?.toLowerCase() || "").includes(value) ||
          (formatDatetime(data.createdAt)?.toLowerCase() || "").includes(
            value
          ) ||
          (data.description?.toLowerCase() || "").includes(value)
        );
      });
      setFilteredData(filtered);
    }
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
      name: "Number",
      selector: (row) => row.id,
    },
    {
      name: "Label Name",
      selector: (row) => row.label_name,
    },
    {
      name: "Sub Label Name",
      selector: (row) => row.sub_label_name,
    },
    {
      name: "Description",
      selector: (row) => (row.description === "" ? "n/a" : row.description),
    },
    {
      name: "Date Created",
      selector: (row) => formatDatetime(row.createdAt),
    },
  ];
  const TagOptions = [
    { value: "liabilities", label: "LIABILITIES" },
    { value: "asset", label: "ASSET" },
    { value: "equity", label: "EQUITY" },
  ];

  const AccountsOptions = [
    { value: "Loan", label: "Loan" },
    { value: "Lend", label: "Lend" },
    { value: "Asset", label: "Asset Acount" },
    { value: "Liabilities", label: "Liabilities Acount" },
  ];

  const handleChange = (selectedOptions) => {
    const formattedOptions = selectedOptions.map((option) => ({
      value: option.value,
      label: option.label,
    }));
    setTag(formattedOptions);
  };

  const handleChangeAccount = (selectedOptions) => {
    const formattedOptions = selectedOptions.map((option) => ({
      value: option.value,
      label: option.label,
    }));
    setAccounts(formattedOptions);
  };
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="my-container">
        <div className="row mb-3">
          <div className="col-6">
            <label className="h2">LABEL MANAGEMENT</label>
          </div>
          <div className="col-6">
            <button
              className="float-end btn btn-primary btn-lg fs-5"
              onClick={handleShow}
            >
              <Plus size={32} color="#f2f2f2" /> Create
            </button>
          </div>
        </div>

        <div className="row mb-5">
          <div className="col-12">
            <div class="input-group mb-3 border border-light border-radius-2">
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
            </div>
          </div>
        </div>

        <DataTable
          columns={tableDataObject}
          data={filteredData}
          customStyles={customStyles}
          pagination
          onRowClicked={handleUpdateModal}
        />
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
              <Modal.Title>LABEL DETAILS</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="row mb-5">
                <div className="col-sm">
                  <Form.Group controlId="exampleForm.ControlInput1">
                    <Form.Label className="fs-5">Tag:</Form.Label>
                    <Select
                      required
                      isMulti
                      options={TagOptions}
                      value={tags}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group controlId="exampleForm.ControlInput1">
                    <Form.Label className="fs-5">Accounts:</Form.Label>
                    <Select
                      required
                      isMulti
                      value={accounts}
                      options={AccountsOptions}
                      onChange={handleChangeAccount}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row mb-5">
                <div className="col-6">
                  <Form.Group controlId="exampleForm.ControlInput1">
                    <Form.Label className="fs-5">Label Name:</Form.Label>
                    <Form.Control
                      className="p-3"
                      placeholder="Sub Label Name"
                      onChange={(e) => setLabelName(e.target.value.trim())}
                      type="text"
                      required
                    />
                  </Form.Group>
                </div>
                <div className="col-6">
                  <Form.Group controlId="exampleForm.ControlInput1">
                    <Form.Label className="fs-5">Sub Label Name:</Form.Label>
                    <Form.Control
                      className="p-3"
                      placeholder="Sub Label Name"
                      onChange={(e) => setSubLabelName(e.target.value.trim())}
                      type="text"
                      required
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-9">
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
                      placeholder="Enter Description"
                      onChange={(e) => setDescription(e.target.value.trim())}
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
              <Modal.Title>LABEL DETAILS</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="row mb-5">
                <div className="col-sm">
                  <Form.Group controlId="exampleForm.ControlInput1">
                    <Form.Label className="fs-5">Tag:</Form.Label>
                    <Select
                      required
                      isMulti
                      options={TagOptions}
                      value={tags}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-sm">
                  <Form.Group controlId="exampleForm.ControlInput1">
                    <Form.Label className="fs-5">Accounts:</Form.Label>
                    <Select
                      required
                      isMulti
                      value={accounts}
                      options={AccountsOptions}
                      onChange={handleChangeAccount}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="row mb-5">
                <div className="col-6">
                  <Form.Group controlId="exampleForm.ControlInput1">
                    <Form.Label className="fs-5">Label Name:</Form.Label>
                    <Form.Control
                      className="p-3"
                      placeholder="Sub Label Name"
                      onChange={(e) => setLabelName(e.target.value.trim())}
                      type="text"
                      value={labelName}
                      required
                    />
                  </Form.Group>
                </div>
                <div className="col-6">
                  <Form.Group controlId="exampleForm.ControlInput1">
                    <Form.Label className="fs-5">Sub Label Name:</Form.Label>
                    <Form.Control
                      className="p-3"
                      placeholder="Sub Label Name"
                      onChange={(e) => setSubLabelName(e.target.value.trim())}
                      value={subLabelName}
                      type="text"
                      required
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-9">
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
                      placeholder="Enter Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value.trim())}
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
                Update
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default LabelManagement;
