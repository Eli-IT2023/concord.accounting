import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ELI from "../../assets/img/accounting logo.jpg";
import "../../assets/css/style.css";
import swal from "sweetalert";
import axios from "axios";
import BASE_URL from "../../assets/global/url";

const NewPassword = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [userID, setUserID] = useState("");
  const [emailError, setEmailError] = useState(false); // Track email error state
  const [passwordError, setPasswordError] = useState(false); // Track password match error state

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

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prevShowPassword) => !prevShowPassword);
  };

  const [validation, setValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    isLongEnough: false,
    passwordsMatch: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    setValidation({
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isLongEnough: password.length >= 8,
      passwordsMatch:
        password && confirmPassword ? password === confirmPassword : false,
    });
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setEmailError(true);
      swal({
        title: "Incorrect Email Format",
        text: "Please enter a valid email address",
        icon: "error",
        buttons: false,
        timer: 2000,
      });
      return;
    } else {
      setEmailError(false);
    }

    if (password !== confirmPassword) {
      setPasswordError(true);
      swal({
        title: "Password not matched",
        text: "Please check your password",
        icon: "warning",
        buttons: false,
        timer: 2000,
      });
      return;
    } else {
      setPasswordError(false);
    }

    // Password change logic
    swal({
      title: "Are you sure?",
      text: "Click OK to change password",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        try {
          axios
            .post(BASE_URL + "/newPassword/changePassword", {
              password,
              email,
              userID,
            })
            .then((response) => {
              if (response.status === 200) {
                swal({
                  title: "Success!",
                  text: "Password has been changed successfully",
                  icon: "success",
                  buttons: false,
                  timer: 2000,
                }).then(() => {
                  navigate("/");
                });
              }
            })
            .catch((error) => {
              if (error.response && error.response.status === 404) {
                // If user not found (404)
                swal({
                  title: "User Not Found",
                  text: "Incorrect User ID or Email",
                  icon: "error",
                });
              } else if (error.response && error.response.status === 500) {
                // If there's a server error (500)
                swal({
                  title: "Server Error",
                  text: "Failed to update password. Please contact our support team.",
                  icon: "error",
                });
              } else {
                swal({
                  title: "Something Went Wrong",
                  text: "Please contact our support team.",
                  icon: "error",
                });
              }
            });
        } catch (error) {
          console.error("Error changing password:", error);
          swal({
            title: "Error!",
            text: "Something went wrong.",
            icon: "error",
            buttons: false,
            timer: 2000,
          });
        }
      }
    });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 login-container py-3">
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
                <h1 className="mb-2 fs-3">Change Password</h1>
                <p className="text-muted fs-5">
                  Enter your new password to complete the change password
                  process
                </p>
              </div>
              <div className="mb-3">
                <label htmlFor="userID" className="form-label fs-5">
                  User ID
                </label>
                <input
                  type="text"
                  id="userID"
                  placeholder="Enter User ID"
                  required
                  className="form-control form-control-lg"
                  value={userID}
                  onChange={(e) => setUserID(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label fs-5">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter Email"
                  required
                  className={`form-control form-control-lg ${
                    emailError ? "border border-danger" : ""
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-3 position-relative password-container">
                <label htmlFor="password" className="form-label fs-5">
                  New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`form-control form-control-lg ${
                    passwordError ? "border border-danger" : ""
                  }`}
                  id="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <i
                  className={`fa-solid ${
                    showPassword ? "fa-eye-slash" : "fa-eye"
                  } position-absolute cursor-pointer fs-5`}
                  onClick={togglePasswordVisibility}
                  style={{
                    top: "50%",
                    right: "10px",
                    transform: "translateY(-50%)",
                  }}
                ></i>
              </div>

              <div className="mb-3 position-relative password-container">
                <label htmlFor="password" className="form-label fs-5">
                  Confirm Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-control form-control-lg ${
                    passwordError ? "border border-danger" : ""
                  }`}
                  id="confirmPassword"
                  placeholder="Enter Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <i
                  className={`fa-solid ${
                    showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                  } position-absolute cursor-pointer fs-5`}
                  onClick={toggleConfirmPasswordVisibility}
                  style={{
                    top: "50%",
                    right: "10px",
                    transform: "translateY(-50%)",
                  }}
                ></i>
              </div>

              <div className="col-sm">
                <div
                  style={{
                    color: validation.hasUpperCase ? "green" : "red",
                  }}
                >
                  {validation.hasUpperCase ? "✔ " : "✘ "} At least one uppercase
                  letter
                </div>
                <div
                  style={{
                    color: validation.hasLowerCase ? "green" : "red",
                  }}
                >
                  {validation.hasLowerCase ? "✔ " : "✘ "} At least one lowercase
                  letter
                </div>
                <div
                  style={{
                    color: validation.hasNumber ? "green" : "red",
                  }}
                >
                  {validation.hasNumber ? "✔ " : "✘ "} At least one number
                </div>
                <div
                  style={{
                    color: validation.hasSpecialChar ? "green" : "red",
                  }}
                >
                  {validation.hasSpecialChar ? "✔ " : "✘ "} At least one special
                  character
                </div>
                <div
                  style={{
                    color: validation.isLongEnough ? "green" : "red",
                  }}
                >
                  {validation.isLongEnough ? "✔ " : "✘ "} At least 8 characters
                  long
                </div>
                <div
                  style={{
                    color: validation.passwordsMatch ? "green" : "red",
                  }}
                >
                  {validation.passwordsMatch ? "✔ " : "✘ "} Passwords match
                </div>
              </div>

              <div className="d-grid mb-3 mt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!Object.values(validation).every(Boolean)}
                  className="btn btn-primary btn-lg"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPassword;
