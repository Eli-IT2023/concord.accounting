import React from "react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import BASE_URL from "../assets/global/url";
import swal from "sweetalert";

export default function ProtectedRoutes({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const guestRoutes = [
      "/",
      "/forgot-password",
      "/wheel",
      "/OTP",
      "/change-password",
      "/new-password",
    ];

    const token = localStorage.getItem("accessToken");
    if (token) {
      const decodedToken = jwtDecode(token);
      const isAccountActive = async () => {
        try {
          const res = await axios.get(
            `${BASE_URL}/masterList/isAccountActive`,
            {
              params: {
                id: decodedToken.id,
              },
            }
          );

          // Log out user
          if (!res.data.status) {
            localStorage.removeItem("accessToken");

            const wrapper = document.createElement("div");
            wrapper.classList.add("center-swal-text");
            wrapper.innerHTML =
              "Your account is inactive. Please activate your account to log in again.";

            swal({
              icon: "error",
              title: "Session Expired",
              content: wrapper,
              buttons: "OK",
            }).then(() => {
              navigate("/");
              return;
            });
          }
        } catch (error) {
          console.error(error);
        }
      };

      isAccountActive();
    }

    if (!token && !guestRoutes.includes(location.pathname)) {
      navigate("/");
    }
  }, [navigate, location]);

  return <>{children}</>;
}
