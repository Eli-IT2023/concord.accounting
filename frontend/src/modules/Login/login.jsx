import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import { Link, useNavigate } from "react-router-dom";
import ELI from "../../assets/img/ELI LOGO.png";
import Logo from "../../assets/img/logo.jpg";
import swal from "sweetalert";
import "../../assets/css/style.css";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loginCredential, setLoginCredential] = useState(""); // Can be email or username
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const rememberedCredential = localStorage.getItem("rememberedCredential");
    const rememberedPassword = localStorage.getItem("rememberedPassword");
    const rememberMe = localStorage.getItem("rememberMe");

    if (rememberMe === "true") {
      setLoginCredential(rememberedCredential || "");
      setPassword(rememberedPassword || "");
      setIsChecked(true);
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);

    if (event.target.checked) {
      localStorage.setItem("rememberedCredential", loginCredential);
      localStorage.setItem("rememberedPassword", password);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("rememberedCredential");
      localStorage.removeItem("rememberedPassword");
      localStorage.removeItem("rememberMe");
    }
  };

  // Auto-detect if input is email or username
  const getLoginType = (credential) => {
    // Check if it contains @ symbol (basic email validation)
    return credential.includes("@") ? "email" : "username";
  };

  const initialized = useRef(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

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
    setIsSubmitting(true);

    // Determine login type based on input
    const loginType = getLoginType(loginCredential);

    // Prepare the request payload
    const payload = {
      [loginType === "email" ? "email" : "username"]: loginCredential,
      password: password,
    };

    axios
      .post(BASE_URL + "/masterList/login", payload)
      .then((response) => {
        if (response.status === 200) {
          // Save remember me data if checked
          if (isChecked) {
            localStorage.setItem("rememberedCredential", loginCredential);
            localStorage.setItem("rememberedPassword", password);
            localStorage.setItem("rememberMe", "true");
          } else {
            localStorage.removeItem("rememberedCredential");
            localStorage.removeItem("rememberedPassword");
            localStorage.removeItem("rememberMe");
          }

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
            text: "The login credentials or password you entered is incorrect",
            icon: "error",
            buttons: false,
            timer: 2000,
          });
          setIsSubmitting(false);
        } else if (response.status === 203) {
          swal({
            title: "Inactive User",
            text: "The user is inactive",
            icon: "error",
            buttons: false,
            timer: 2000,
          });
          setIsSubmitting(false);
        } else if (response.status === 204) {
          swal({
            title: "User Not Found",
            text: `No account found with this ${loginType}`,
            icon: "error",
            buttons: false,
            timer: 2000,
          });
          setIsSubmitting(false);
        }
      })
      .catch((error) => {
        console.error(error.response?.data || error);
        swal({
          title: "Something Went Wrong",
          text: "Please contact our support team",
          icon: "error",
        }).then(() => {
          setIsSubmitting(false);
        });
      });
  };

  // fetch logo from company profile
  const [settings, setSettings] = useState(null);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/CompanyProfile/fetchData`
        );
        if (response.data.success) {
          setSettings(response.data.data); // logo is already base64 from backend
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 login-container">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="bg-white p-4 p-md-5 custom-login-form shadow">
              <div className="text-center mb-4">
                <img
                  src={settings?.logo || ELI}
                  alt="Company Logo"
                  className="img-fluid"
                  style={{ maxWidth: "250px", width: "100%" }}
                />
              </div>
              <div className="text-center mb-4">
                <h1 className="mb-2 fs-3">Login</h1>
                <p className="text-muted fs-5">Welcome! Log in to continue.</p>
              </div>

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label htmlFor="loginCredential" className="form-label fs-5">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="loginCredential"
                    placeholder="Enter Email or Username"
                    value={loginCredential}
                    onChange={(e) => setLoginCredential(e.target.value)}
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
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isSubmitting || !loginCredential || !password}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Signing In...
                      </>
                    ) : (
                      <>Sign In</>
                    )}
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
