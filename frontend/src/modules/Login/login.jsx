import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import { Link, useNavigate } from "react-router-dom";
import ELI from "../../assets/img/accounting logo.svg";
import swal from "sweetalert";
import "../../assets/css/style.css";
import useCompanyProfile from "../../hooks/customHook/useCompanyProfile";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { company, loading } = useCompanyProfile();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const rememberedPassword = localStorage.getItem("rememberedPassword");
    const rememberMe = localStorage.getItem("rememberMe");

    if (rememberMe) {
      setEmail(rememberedEmail || "");
      setPassword(rememberedPassword || "");
      setIsChecked(true);
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  const initialized = useRef(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    console.log("Token:", accessToken);

    try {
      if (accessToken) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }

    if (!initialized.current) {
      initialized.current = true;
      autoCreate();
    }
  }, []);

  const autoCreate = async () => {
    // auto create acc for super admin, expenses types
    try {
      const response = await axios.post(
        `${BASE_URL}/masterlist/superadmin_add`
      );
      if (response && response.status === 200) {
        console.error("Superadmin role already exists");
      } else if (response && response.status === 401) {
        console.error("Superadmin user not found");
      } else {
        console.error("Error creating rbac:", response);
      }
    } catch (error) {
      console.error("Error creating rbac:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    axios
      .post(BASE_URL + "/masterList/login", { email, password })
      .then((response) => {
        if (response.status === 200) {
          localStorage.setItem("accessToken", response.data.accessToken);
          swal({
            title: "Success!",
            text: "You have successfully logged in.",
            icon: "success",
            buttons: false,
            timer: 2000,
          }).then(() => {
            navigate("/dashboard");
          });
        } else if (response.status === 201) {
          swal({
            title: "Incorrect Credentials",
            text: "The email or password you entered is incorrect",
            icon: "error",
            buttons: false,
            timer: 2000,
          });
        } else if (response.status === 203) {
          swal({
            title: "Inactive User",
            text: "The user is inactive",
            icon: "error",
            buttons: false,
            timer: 2000,
          });
        } else if (response.status === 204) {
          swal({
            title: "Unknown User",
            text: "User not found",
            icon: "error",
            buttons: false,
            timer: 2000,
          });
        }
      })
      .catch((error) => {
        console.error(error.response.data);
        swal({
          title: "Something Went Wrong",
          text: "Please contact our support team",
          icon: "error",
        }).then(() => {
          window.location.reload();
        });
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 login-container">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="bg-white p-4 p-md-5 custom-login-form shadow">
              <div className="text-center mb-4">
                <img
                  src={
                    !loading && company && company.profile_picture
                      ? `data:image/jpeg;base64,${company.profile_picture}`
                      : ELI
                  }
                  alt="Logo"
                  className="img-fluid mt-4"
                  style={{ width: "100px" }}
                />
              </div>
              <div className="text-center mb-4">
                <h1 className="mb-2 fs-3">Login</h1>
                <p className="text-muted fs-5">Welcome! Log in to continue.</p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fs-5">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    id="email"
                    placeholder="Enter Email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3 position-relative password-container">
                  <label htmlFor="password" className="form-label fs-5">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control form-control-lg"
                    id="password"
                    placeholder="Enter Password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <i
                    className={`fa-solid ${
                      showPassword ? "fa-eye" : "fa-eye-slash"
                    } position-absolute cursor-pointer fs-5`}
                    onClick={togglePasswordVisibility}
                    style={{
                      top: "50%",
                      right: "10px",
                      transform: "translateY(-50%)",
                    }}
                  ></i>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input remember-me"
                      id="rememberMe"
                      checked={isChecked}
                      onChange={handleCheckboxChange}
                    />
                    <label
                      className="form-check-label fs-5"
                      htmlFor="rememberMe"
                    >
                      Remember me
                    </label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-decoration-none fs-5 text-end"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="d-grid mb-4">
                  <button type="submit" className="btn btn-primary btn-lg">
                    Sign in
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
