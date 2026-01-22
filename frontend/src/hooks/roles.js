import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import BASE_URL from "../assets/global/url";

export default function Roles({ children }) {
  const [authrztn, setauthrztn] = useState([]);
  const [roleType, setRoleType] = useState(null); // Additional state for role type
  const [rbacUserRole, setRbacUserRole] = useState(null); // Additional state for user role
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (typeof accessToken === "string") {
      const decoded = jwtDecode(accessToken);

      axios
        .get(`${BASE_URL}/masterList/viewAuthorization/${decoded.id}`)
        .then((res) => {
          if (res.status === 200) {
            setauthrztn(res.data.userRole.col_authorization || []);
            setRoleType(res.data.userRole.role_type); // Set role type separately
            setRbacUserRole(res.data.userRole.user_role);
          }
        })
        .catch((err) => {
          console.error("Authorization error:", err);
        });
    }
  }, [navigate, location]);

  return <>{children(authrztn, roleType, rbacUserRole)}</>; // Now passing both values
}
