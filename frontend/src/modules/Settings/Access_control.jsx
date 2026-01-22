import React, { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { customStyles } from "../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../assets/global/url";
import swal from "sweetalert";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
const AccessControl = ({ authrztn }) => {
  const navigate = useNavigate();
  const truncateText = (text, length) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [userRole, setUserRole] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const userLoggedID = useDecodeToken();
  const pagination = useServerPagination(
    BASE_URL + "/userRole/getUserRoleData",
    10
  );
  const fetchUserRole = () => {
    pagination.updateParams({
      filterColumn,
      searchText,
    });
    setIsLoading(false);
    // axios
    //   .get(BASE_URL + "/userRole/getUserRoleData", {
    //     params: {
    //       filterColumn,
    //       searchText,
    //     },
    //   })
    //   .then((res) => {
    //     setUserRole(res.data);
    //     setIsLoading(false);
    //   })
    //   .catch((err) => {});
  };

  const columns = [
    {
      name: "Role Name",
      selector: (row) => row.col_rolename,
    },
    {
      name: "Role Authorization",
      selector: (row) => truncateText(row.col_authorization, 100),
    },
    {
      name: "Description",
      selector: (row) => row.col_desc || "--",
    },
  ];
  if (authrztn.includes("RBAC-Delete")) {
    columns.push({
      name: "Action",
      selector: (row) => (
        <i
          className="fas fa-trash"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() => handleDeleteUserRole(row.col_id)}
        ></i>
      ),
    });
  }

  const handleClickRbac = async (data) => {
    navigate(
      `/settings/update-rbac/${data.col_id}?page=${pagination.currentPage}`
    );
  };

  const handleDeleteUserRole = async (userRoleId) => {
    swal({
      title: "Confirm Deletion",
      text: "Are you sure you want to delete?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          const response = await axios.delete(
            `${BASE_URL}/userRole/deleteRbac/${userRoleId}`,
            {
              data: { masterlist_id: userLoggedID },
            }
          );
          if (response.status === 200) {
            swal({
              title: "User Role Deleted Successfully!",
              text: "The user role has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              fetchUserRole();
            });
          } else if (response.status === 202) {
            swal({
              icon: "error",
              title: "Deletion Prohibited",
              text: "You cannot delete a user role that is in use.",
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
          swal({
            icon: "error",
            title: "Error",
            text: "An error occurred while deleting the user role.",
          });
        }
      }
    });
  };

  // const filteredItems = userRole.filter((item) => {
  //   if (!searchText) return true;

  //   const searchLower = searchText.toLowerCase();

  //   switch (filterColumn) {
  //     case "col_rolename":
  //       return item.col_rolename.toLowerCase().includes(searchLower);
  //     case "col_authorization":
  //       return item.col_authorization.toLowerCase().includes(searchLower);
  //     case "col_desc":
  //       return item.col_desc.toLowerCase().includes(searchLower);
  //     default:
  //       return (
  //         item.col_rolename.toLowerCase().includes(searchLower) ||
  //         item.col_authorization.toLowerCase().includes(searchLower) ||
  //         item.col_desc.toLowerCase().includes(searchLower)
  //       );
  //   }
  // });

  const clearFilter = () => {
    setSearchText("");
    setFilterColumn("");
  };

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchUserRole();
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, [searchText, filterColumn]);

  useEffect(() => {
    setUserRole(pagination.data);
  }, [pagination.data]);

  useEffect(() => {
    fetchUserRole();
  }, [searchText, filterColumn]);

  useEffect(() => {
    setSearchText("");
  }, [filterColumn]);

  useEffect(() => {
    const paramsPage = searchParams.get("page");
    const page =
      isNaN(paramsPage) || paramsPage === null ? 1 : searchParams.get("page");
    pagination.setCurrentPage(parseInt(page));
  }, []);

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
      ) : authrztn.includes("RBAC-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">ROLE-BASED ACCESS CONTROL</span>
              <span>RBAC</span>
            </div>
            <div>
              {authrztn.includes("RBAC-Add") && (
                <Link
                  to="/settings/create-rbac"
                  className="btn btn-primary d-flex flex-row align-items-center title-button"
                >
                  <i className="bx bx-plus fs-5"></i> Create
                </Link>
              )}
            </div>
          </div>
          {/* <div className="container-fluid mt-4 p-0">
            <div className="row mx-auto">
              <div className="col-sm mb-2">
                <span>Role Name</span>
                <select name="" id="" className="form-select">
                  <option value="" selected disabled>
                    Select Role Name
                  </option>
                </select>
              </div>
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container w-100">
                <button className="btn w-100">Apply Filter</button>
                <button className="btn btn-secondary w-100">
                  Clear Filter
                </button>
              </div>
              <div className="col-sm"></div>
              <div className="col-sm"></div>
            </div>
          </div> */}
          <div className="w-100 mt-4 mb-2 container-fluid">
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
                      filterColumn === "role-name" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("role-name")}
                  >
                    Role Name
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${
                      filterColumn === "role-authorization" ? "active" : ""
                    }`}
                    onClick={() => setFilterColumn("role-authorization")}
                  >
                    Role Authorization
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
          {/* data table */}
          <div className="w-100 mt-3 container-fluid">
            <DataTable
              columns={columns}
              data={userRole}
              customStyles={customStyles}
              className="dataTable"
              onRowClicked={handleClickRbac}
            />
            <PaginationControls {...pagination} />
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
};

export default AccessControl;
