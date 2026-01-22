import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import BASE_URL from "../../assets/global/url";
import swal from "sweetalert";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

const AccessControl = ({ authrztn }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Table state
  const [paginationUrl, setPaginationUrl] = useState(
    BASE_URL + "/userRole/fetchPaginatedUserRole",
  );
  const pagination = useServerPagination(paginationUrl, 10);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  useEffect(() => {
    if (!pagination.loading) {
      setIsLoading(false);
    }
  }, [pagination.loading]);

  const truncateText = (text, length) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  const userLoggedID = useDecodeToken();

  const handleClickRbac = async (data) => {
    navigate(`/settings/update-rbac/${data.col_id}`);
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
            },
          );
          if (response.status === 200) {
            swal({
              title: "User Role Deleted Successfully!",
              text: "The user role has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              pagination.updateParams({});
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

  const handleSearch = (value) => {
    setSearchText(value);
    if (value === "") {
      setPaginationUrl(BASE_URL + "/userRole/fetchPaginatedUserRole");
      pagination.updateParams({});
    } else {
      setPaginationUrl(BASE_URL + "/userRole/fetchFilteredUserRoleData");
      pagination.updateParams({
        searchText: value,
        filterColumn: filterColumn || "all",
      });
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

          <div className="w-100 mt-4 mb-2 container-fluid">
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

          <div className="container-fluid">
            <div className="table-responsive data-table scrollable-contents">
              <table className="table table-hover table-responsive">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      ROLE NAME
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    {userLoggedID ===
                      "11111111-1111-1111-1111-111111111111" && (
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        ROLE AUTHORIZATION
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                    )}
                    <th
                      className="text-muted text-center"
                      style={{ backgroundColor: "#EBEFF4" }}
                    >
                      DESCRIPTION
                      <i className="fas fa-sort ms-1"></i>
                    </th>
                    {authrztn.includes("RBAC-Delete") && (
                      <th
                        className="text-muted text-center"
                        style={{ backgroundColor: "#EBEFF4" }}
                      >
                        ACTION
                        <i className="fas fa-sort ms-1"></i>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagination.error ? (
                    <tr>
                      <td
                        colSpan={authrztn.includes("RBAC-Delete") ? 4 : 3}
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
                      <td
                        colSpan={authrztn.includes("RBAC-Delete") ? 4 : 3}
                        className="text-center py-4"
                      >
                        <div className="d-flex flex-column align-items-center">
                          <span>No data available</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((item, index) => (
                      <tr
                        key={item.col_id}
                        onClick={() => handleClickRbac(item)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="text-center">{item.col_rolename}</td>
                        {userLoggedID ===
                          "11111111-1111-1111-1111-111111111111" && (
                          <td className="text-center">
                            {truncateText(item.col_authorization, 100)}
                          </td>
                        )}
                        <td className="text-center">{item.col_desc || "--"}</td>
                        {authrztn.includes("RBAC-Delete") && (
                          <td className="text-center">
                            <i
                              className="fas fa-trash"
                              style={{
                                cursor: "pointer",
                                color: "red",
                                fontSize: "1.5rem",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUserRole(item.col_id);
                              }}
                            ></i>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
