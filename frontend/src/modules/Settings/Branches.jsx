import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Modal, Button, Form } from "react-bootstrap";
import "../../assets/css/style.css";
import swal from "sweetalert";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import { customStyles } from "../styles/table-style";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { ArrowsClockwise } from "@phosphor-icons/react";
const Branches = ({ authrztn }) => {
  const [showAddWarehouseModal, setshowAddWarehouseModal] = useState("");
  const [showUpdateWarehouseModal, setshowUpdateWarehouseModal] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const handleShowAddWarehouseModal = () => setshowAddWarehouseModal(true);
  const handleCloseAddWarehouseModal = () => setshowAddWarehouseModal(false);

  const handleShowUpdateWarehouseModal = () =>
    setshowUpdateWarehouseModal(true);
  const handleCloseUpdateWarehouseModal = () =>
    setshowUpdateWarehouseModal(false);

  const [validated, setValidated] = useState(false);
  const [search, setSearch] = useState("");
  const [inboundData, setInboundData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  const [warehouse, setWarehouse] = useState([]);
  // const [warehouseId, setWarehouseId] = useState('');
  const [name, setName] = useState("");
  const [branchType, setBranchType] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [status, setStatus] = useState(1);
  const [description, setDescription] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const userLoggedID = useDecodeToken();
  const [selectedWarehouse, setSelectedWarehouse] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);

  const branchTypeOptions = [
    { value: "Main", label: "Main" },
    { value: "Sub Branch", label: "Sub Branch" },
    // Add more options as needed
  ];

  //**********Table Display
  const userData = inboundData.map((data, i) => ({
    key: i,
    warehouseId: data.warehouse_id,
    name: data.name,
    branchType: data.branch_type,
    status: data.status == 1 ? "Active" : "Inactive",
    address: data.address,
    municipality: data.municipality,
    province: data.province,
    zipcode: data.zipcode,
    description: data.description,
  }));

  // Warehouse soft delete
  const handleDeleteWarehouse = (id) => {
    swal({
      icon: "warning",
      title: "Confirm Deletion",
      text: "Are you sure you want to delete?",
      buttons: ["Cancel", "OK"],
      dangerMode: true,
    })
      .then(async (confirm) => {
        if (confirm) {
          const res = await axios.put(
            `${BASE_URL}/warehouse/warehouseSoftDelete/${id}`
          );

          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Deleted Successfully",
              text: "The warehouse has been deleted successfully",
            }).then(() => reloadTable());
          }
          return;
        }
        return;
      })
      .catch((error) => {
        if (error.response && error.response.status === 409) {
          swal({
            icon: "error",
            title: "Deletion Prohibited!",
            text: "This warehouse cannot be deleted because there are products still associated with it.",
          });
          return;
        }

        swal({
          title: "Something went wrong",
          text: "Please contact your support immediately",
          icon: "error",
          timer: 2000,
        });
        console.error(error);
      });
  };

  const columns = [
    {
      name: (
        <input
          checked={selectedWarehouse.length === userData.length}
          onChange={(e) => {
            setSelectedWarehouse(() => {
              return e.target.checked
                ? userData.map((item) => item.warehouseId)
                : [];
            });
          }}
          type="checkbox"
        />
      ),
      selector: (row) => (
        <input
          checked={selectedWarehouse.includes(row.warehouseId)}
          onChange={() => {
            setSelectedWarehouse((prev) => {
              if (!selectedWarehouse.includes(row.warehouseId)) {
                return [...prev, row.warehouseId];
              } else {
                return prev.filter(
                  (warehouseId) => warehouseId !== row.warehouseId
                );
              }
            });
          }}
          type="checkbox"
        />
      ),
      width: "8rem",
    },
    // {
    //   name: "ID",
    //   selector: (row) => row.warehouseId,
    // },
    {
      name: "Name",
      selector: (row) => row.name,
    },
    {
      name: "Branch Type",
      selector: (row) => row.branchType,
    },
    {
      name: "Address",
      selector: (row) => `${row.address} ${row.municipality} ${row.province}`,
      cell: (row) => (
        <div className="text-wrap">
          {row.address} {row.municipality} {row.province}
        </div>
      ),
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
            color: row.status === "Active" ? "green" : "red",
          }}
        >
          {row.status}
        </div>
      ),
    },
    {
      name: "Action",
      selector: (row) =>
        row.warehouseId !== "11111111-1111-1111-1111-111111111111" && (
          <i
            className="fas fa-trash"
            style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
            onClick={() => handleDeleteWarehouse(row.warehouseId)}
          ></i>
        ),
    },
  ];

  //**********Validations
  const SuccessInserted = (res) => {
    swal({
      title: "Added New Warehouse",
      text: "The Warehouse has been added successfully",
      icon: "success",
      button: "OK",
    }).then(() => {
      setName("");
      setBranchType("");
      setAddress("");
      setProvince("");
      setMunicipality("");
      setZipcode("");
      setStatus("");
      setDescription("");
      // const newId = res.data.warehouse_id;
      // setWarehouse((prev) => [
      //   ...prev,
      //   {
      //     warehouseId: newId,
      //     name: res.data.name,
      //     branchType: res.data.branch_type,
      //     address: res.data.address,
      //     province: res.data.province,
      //     municipality: res.data.municipality,
      //     zipcode: res.data.zipcode,
      //     status: res.data.status,
      //     description: res.data.description,
      //   },
      // ]);
      reloadTable();
    });
  };
  const Duplicate_Message = () => {
    swal({
      title: "Warehouse is Already Exist",
      text: "Use other warehouse name",
      icon: "error",
      button: "OK",
    });
  };

  const ErrorInserted = () => {
    swal({
      title: "Something went wrong",
      text: "Please Contact our Support",
      icon: "error",
      button: "OK",
    });
  };
  //**********End Validations

  const pagination = useServerPagination(
    BASE_URL + "/warehouse/getWarehouseForFilter",
    10
  );

  //**********Reload Table
  const reloadTable = () => {
    pagination.updateParams({
      filterColumn,
      searchText,
      statusFilter,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/warehouse/getWarehouseForFilter", {
    //     params: {
    //       filterColumn,
    //       searchText,
    //       statusFilter,
    //     },
    //   })
    //   .then((res) => {
    //     const sortedWarehouseList = res.data.sort(
    //       (a, b) => b.warehouse_id - a.warehouse_id
    //     );
    //     setInboundData(sortedWarehouseList);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => console.log(err));
  };

  const fetchWarehouse = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/warehouse/getWarehouse`);
      setWarehouse(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (pagination.data) {
      const sortedWarehouseList = pagination.data.sort(
        (a, b) => b.warehouse_id - a.warehouse_id
      );
      setInboundData(sortedWarehouseList);
    }
  }, [pagination.data]);

  useEffect(() => {
    fetchWarehouse();
  }, []);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     reloadTable();
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, [searchText, filterColumn]);
  useEffect(() => {
    reloadTable();
  }, [searchText, statusFilter, filterColumn]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);
  //**********End Reload Table

  //**********Search Function
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredData(inboundData);
    } else {
      const filtered = inboundData.filter((item) => {
        return (
          (item.warehouseId && item.warehouseId.includes(search)) ||
          (item.name &&
            item.name.toLowerCase().includes(search.toLowerCase())) ||
          (item.status &&
            item.status.toLowerCase().includes(search.toLowerCase())) ||
          (item.branch_type &&
            item.branch_type.toLowerCase().includes(search.toLowerCase()))
        );
      });
      setFilteredData(filtered);
    }
  }, [search, inboundData]);
  //**********End Search Function

  //**********Create Function
  const createWarehouse = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill the red text fields",
      });
    } else {
      axios
        .post(`${BASE_URL}/warehouse/create`, {
          name: name,
          branchType: branchType,
          address: address,
          province: province,
          municipality: municipality,
          zipcode: zipcode,
          status: status,
          description: description,
          userLoggedID,
        })
        .then((res) => {
          console.log(res);
          if (res.status === 200) {
            setValidated(false);
            SuccessInserted(res);
            handleCloseAddWarehouseModal();
          } else if (res.status === 201) {
            if (res.data === "Exist") {
              Duplicate_Message();
            } else if (res.data === "MainBranchExists") {
              swal({
                icon: "error",
                title: "Main Branch Already Exists",
                text: "There is already a main branch registered. You cannot register another main branch.",
              });
            } else {
              ErrorInserted();
            }
          } else {
            ErrorInserted();
          }
        });
    }
    setValidated(true);
  };

  //**********End Create Function

  //**********Show Update Modal
  // const [selectedRow, setSelectedRow] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    warehouseId: "",
    name: "",
    branchType: "",
    address: "",
    province: "",
    municipality: "",
    zipcode: "",
    status: "Inactive",
    description: "",
  });

  const handleUpdateModalToggle = (updateData = null) => {
    handleShowUpdateWarehouseModal(!showUpdateWarehouseModal);
    if (updateData) {
      setUpdateFormData({
        warehouseId: updateData.warehouseId,
        name: updateData.name,
        branchType: updateData.branchType,
        address: updateData.address,
        province: updateData.province,
        municipality: updateData.municipality,
        zipcode: updateData.zipcode,
        status: updateData.status,
        description: updateData.description,
      });
    } else {
      setUpdateFormData({
        warehouseId: "",
        name: "",
        branchType: "",
        address: "",
        province: "",
        municipality: "",
        zipcode: "",
        status: "",
        description: "",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleStatusChange = (e) => {
    const isChecked = e.target.checked;
    setUpdateFormData((prevData) => {
      const newState = {
        ...prevData,
        status: isChecked ? "Active" : "Inactive",
      };
      return newState;
    });
  };
  //**********End Show Update Modal
  //**********Update Warehouse
  const updateWarehouse = async (e) => {
    e.preventDefault();
    if (!updateFormData.name) {
      swal({
        icon: "error",
        title: "Name is required",
        text: "Please enter a name before updating.",
      });
      return;
    }
    try {
      const warehouseId = updateFormData.warehouseId;
      const response = await axios.put(
        `${BASE_URL}/warehouse/updateWarehouse/${warehouseId}`,
        {
          name: updateFormData.name,
          branchType: updateFormData.branchType,
          address: updateFormData.address,
          province: updateFormData.province,
          municipality: updateFormData.municipality,
          zipcode: updateFormData.zipcode,
          status: updateFormData.status,
          description: updateFormData.description,
          userLoggedID,
        }
      );

      if (response.status === 200) {
        swal({
          title: "Update successful!",
          text: "The Warehouse has been updated successfully.",
          icon: "success",
          button: "OK",
        }).then(() => {
          reloadTable();
          handleCloseUpdateWarehouseModal(true);
          setUpdateFormData({
            warehouseId: "",
            name: "",
            branchType: "",
            address: "",
            province: "",
            municipality: "",
            zipcode: "",
            status: "Inactive",
            description: "",
          });
        });
      } else if (response.status === 202) {
        if (response.data === "Exist") {
          swal({
            icon: "error",
            title: "Warehouse already exists",
            text: "Please input another Warehouse Name",
          });
        } else if (response.data === "MainBranchExists") {
          swal({
            icon: "error",
            title: "Main Branch Already Exists",
            text: "There is already a main branch registered. You cannot register another main branch.",
          });
        } else {
          swal({
            icon: "error",
            title: "Something went wrong",
            text: "Please contact our support",
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
      if (err.response && err.response.status === 409) {
        swal({
          icon: "error",
          title: "Cannot Mark as Inactive",
          text: "This warehouse still contains stock.",
        });
      }
      console.log(err);
    }
  };

  //**********End Update Warehouse

  // Handle submit change status
  const handleChangeStatus = () => {
    // Update Status
    const updateStatus = async () => {
      try {
        const res = await axios.put(
          `${BASE_URL}/warehouse/bulkWarehouseStatusUpdate`,
          {
            selectedWarehouse,
            selectedStatus,
          }
        );

        if (res.status === 200) {
          swal({
            icon: "success",
            title: "Statuses Updated",
            text: "All selected items have been updated.",
          }).then(() => {
            setSelectedStatus("");
            setSelectedWarehouse([]);
            setShowChangeStatusModal(false);
            reloadTable();
          });
          return;
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

        // Handle Empty status validation
        if (selectedStatus === "") {
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
      ) : authrztn.includes("Branches-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">WAREHOUSE BRANCHES</span>
              <span>WAREHOUSE LIST</span>
            </div>

            <div>
              {selectedWarehouse.length > 0 ? (
                <button
                  className="btn btn-secondary title-button"
                  onClick={() => setShowChangeStatusModal(true)}
                >
                  <ArrowsClockwise className="fs-5" color="#f2f2f2" /> Change
                  Status
                </button>
              ) : (
                authrztn.includes("Branches-Add") && (
                  <button
                    className="btn btn-primary d-flex align-items-center title-button"
                    onClick={handleShowAddWarehouseModal}
                  >
                    <i className="bx bx-plus fs-5"></i> Add Warehouse
                  </button>
                )
              )}
            </div>
          </div>
          {/* <div className="w-100 row mx-0 mt-3">
            <div className="col-sm text-end mb-2">
              <button className="btn btn-secondary">Clear Filter</button>
            </div>
            <div className="col-sm mb-2">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div> */}
          <div className="row container-fluid">
            <div className="col-4">
              <label for="status" className="mb-2">
                Status
              </label>
              <select
                className="form-select"
                name="status"
                id="status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="w-100 mt-3 mb-2 container-fluid">
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
                      filterColumn === "branch-type" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("branch-type")}
                  >
                    Branch Type
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "address" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("address")}
                  >
                    Address
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              data={userData}
              customStyles={customStyles}
              onRowClicked={(row) => handleUpdateModalToggle(row)}
              className="dataTable"
            />
            <PaginationControls {...pagination} />
          </div>

          <Modal
            size="xl"
            backdrop="static"
            show={showAddWarehouseModal}
            onHide={handleCloseAddWarehouseModal}
          >
            <Form noValidate validated={validated} onSubmit={createWarehouse}>
              <Modal.Header className="border-0" closeButton>
                <Modal.Title>
                  <h2>Add New Warehouse</h2>
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="row">
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="basedCurrency">
                      <Form.Label>
                        Warehouse Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="basedCurrency">
                      <Form.Label>
                        Branch Type <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        onChange={(e) => setBranchType(e.target.value)}
                        value={branchType}
                        required
                      >
                        <option disabled value="">
                          Select Branch
                        </option>
                        {branchTypeOptions
                          .filter((option) => {
                            if (
                              warehouse.some(
                                (branch) => branch.branch_type === "Main"
                              )
                            ) {
                              return option.value === "Sub Branch";
                            } else {
                              return option.value === "Main";
                            }
                          })
                          .map((option) => (
                            <option value={option.value}>{option.label}</option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="basedCurrency">
                      <Form.Label>
                        Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="basedCurrency">
                      <Form.Label>
                        Province <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        onChange={(e) => setProvince(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="basedCurrency">
                      <Form.Label>
                        Municipality <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        onChange={(e) => setMunicipality(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="basedCurrency">
                      <Form.Label>
                        Zip Code <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        onChange={(e) => setZipcode(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className=" col-sm">
                    <Form.Group>
                      <div className="mt-2 row mb-2">
                        <label className="col-sm-3 col-form-label">
                          Status
                        </label>
                        <div className="col-sm-9 d-flex flex-row align-items-center">
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={status}
                              onChange={(e) => setStatus(e.target.checked)}
                              id="status"
                            />
                            <span className="slider round"></span>
                          </label>
                          <label htmlFor="status">Toggle on to Active</label>
                        </div>
                      </div>
                    </Form.Group>
                  </div>
                  <div className="col-sm">
                    <Form.Group className="mb-3" controlId="basedCurrency">
                      <Form.Label>
                        Description <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={handleCloseAddWarehouseModal}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          {/* *******************************UPDATE MODAL**************************************************************************** */}
          <Modal
            size="xl"
            show={showUpdateWarehouseModal}
            onHide={handleCloseUpdateWarehouseModal}
          >
            <Form noValidate validated={validated} onSubmit={updateWarehouse}>
              <Modal.Header className="border-0" closeButton>
                <Modal.Title>
                  <h2>Update Warehouse Details</h2>
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="row">
                  <div className="col-sm mb-2">
                    <Form.Group>
                      <Form.Label>
                        Warehouse Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="form-control"
                        name="name"
                        value={updateFormData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm mb-2">
                    <Form.Group>
                      <Form.Label>Branch Type</Form.Label>
                      {/* <Form.Control
                    type="text"
                    className="form-control"
                    name="branchType"
                    value={updateFormData.branchType}
                    onChange={handleInputChange}
                  /> */}

                      <Form.Label>
                        Branch Type <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="branchType"
                        onChange={handleInputChange}
                        value={updateFormData.branchType}
                        required
                      >
                        <option disabled value="">
                          Select Branch Type
                        </option>
                        {branchTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm mb-2">
                    <Form.Group>
                      <Form.Label>
                        Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="form-control"
                        name="address"
                        value={updateFormData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm mb-2">
                    <Form.Group>
                      <Form.Label>
                        Province <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="form-control"
                        name="province"
                        value={updateFormData.province}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm mb-2">
                    <Form.Group>
                      <Form.Label>
                        Municipality <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="form-control"
                        name="municipality"
                        value={updateFormData.municipality}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-sm mb-2">
                    <Form.Group>
                      <Form.Label>
                        Zip Code <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        className="form-control"
                        name="zipcode"
                        value={updateFormData.zipcode}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm mb-2">
                    <Form.Group>
                      <div className="mt-2 row mb-2">
                        <label className="col-sm-3 col-form-label">
                          Status
                        </label>
                        <div className="col-sm-9 d-flex flex-row align-items-center">
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={updateFormData.status === "Active"}
                              onChange={handleStatusChange}
                              id="status"
                            />
                            <span className="slider round"></span>
                          </label>
                          <label htmlFor="status">Toggle on to Active</label>
                        </div>
                      </div>
                    </Form.Group>
                  </div>
                  <div className="col-sm mb-2">
                    <Form.Group>
                      <Form.Label>
                        Description <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="description"
                        className="form-control"
                        value={updateFormData.description}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={handleCloseUpdateWarehouseModal}
                >
                  Cancel
                </Button>
                {authrztn.includes("Branches-Add") && (
                  <Button type="submit" variant="primary">
                    Update
                  </Button>
                )}
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
              <div className="">
                <label htmlFor="change-status">Status</label>
                <select
                  name="change-status"
                  id="change-status"
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                  }}
                  className="form-select"
                >
                  <option value="" selected disabled>
                    Select Status
                  </option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
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

export default Branches;
