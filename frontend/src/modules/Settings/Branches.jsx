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

  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/warehouse/getPaginatedWarehouse"
  );
  const pagination = useServerPagination(paginationUrl, 10);

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

  useEffect(() => {
    console.log(pagination.data, "This is pagination data");
    setWarehouse(pagination.data);
  }, [pagination.data]);

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
      setStatus(1);
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
      pagination?.updateParams({});
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

  //SEARCH
  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/warehouse/getPaginatedWarehouse");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/warehouse/getPaginatedWarehouseForFilter");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all",
        statusFilter: statusFilter || "All", // Match backend parameter name
      });
    }
  };

  //**********Reload Table
  const reloadTable = () => {
    axios
      .get(BASE_URL + "/warehouse/getWarehouseForFilter", {
        params: {
          filterColumn,
          searchText,
          statusFilter,
        },
      })
      .then((res) => {
        const sortedWarehouseList = res.data.sort(
          (a, b) => b.warehouse_id - a.warehouse_id
        );
        setInboundData(sortedWarehouseList);
        setIsLoading(false);
      })
      .catch((err) => console.log(err));
  };

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
    status: 0,
    description: "",
  });

  const handleUpdateModalToggle = (updateData = null) => {
    handleShowUpdateWarehouseModal(!showUpdateWarehouseModal);
    if (updateData) {
      setUpdateFormData({
        warehouseId: updateData.warehouse_id,
        name: updateData.name,
        branchType: updateData.branch_type,
        address: updateData.address,
        province: updateData.province,
        municipality: updateData.municipality,
        zipcode: updateData.zipcode,
        status: Number(updateData.status), // Ensure status is a number
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
        status: 0, // Default to 0 (Inactive)
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

  // Update handleStatusChange to use numbers
  const handleStatusChange = (e) => {
    const isChecked = e.target.checked;
    setUpdateFormData((prevData) => ({
      ...prevData,
      status: isChecked ? 1 : 0,
    }));
  };
  //**********End Show Update Modal
  //**********Update Warehouse
  const updateWarehouse = async (e) => {
    e.preventDefault();
    console.log("Submitting with status:", updateFormData.status);
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
          pagination.updateParams({});
          handleCloseUpdateWarehouseModal(true);
          setUpdateFormData({
            warehouseId: "",
            name: "",
            branchType: "",
            address: "",
            province: "",
            municipality: "",
            zipcode: "",
            status: 0,
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
      console.log(err);
    }
  };

  //**********End Update Warehouse

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
              {authrztn.includes("Branches-Add") && (
                <button
                  className="btn btn-primary d-flex align-items-center title-button"
                  onClick={handleShowAddWarehouseModal}
                >
                  <i className="bx bx-plus fs-5"></i> Add Warehouse
                </button>
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
          <div className="container-fluid">
            <div className="table-responsive data-table scrollable-contents">
              <table className="table table-hover table-responsive">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      BRANCH TYPE
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    <th
                      className="text-muted"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      ADDRESS
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    {authrztn.includes("RBAC-Delete") && (
                      <th
                        className="text-muted"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        STATUS
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagination.error ? (
                    <tr>
                      <td className="text-center text-danger py-4">
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
                      <td colSpan={4} className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <span>No data available</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => (
                      <tr
                        key={item.warehouse_id}
                        onClick={() => handleUpdateModalToggle(item)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{item.name}</td>
                        <td>{item.branch_type}</td>

                        <td className="text-wrap">
                          {item.address} {item.municipality} {item.province}
                        </td>
                        <td
                          style={{
                            padding: "5px 10px",
                            borderRadius: "5px",
                            textTransform: "uppercase",
                            fontWeight: "bold",
                            color: item.status === 1 ? "green" : "red",
                          }}
                        >
                          {item.status === 1 ? "Active" : "Inactive"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls {...pagination} />
          </div>
          {/* <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              data={userData}
              pagination
              customStyles={customStyles}
              onRowClicked={(row) => handleUpdateModalToggle(row)}
            />
          </div> */}

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
                              checked={status === 1} // Convert number to boolean for checkbox
                              onChange={(e) =>
                                setStatus(e.target.checked ? 1 : 0)
                              }
                              D
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
                  variant="outline-secondary"
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
                              checked={updateFormData.status === 1} // Convert number to boolean
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
                  variant="outline-secondary"
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
