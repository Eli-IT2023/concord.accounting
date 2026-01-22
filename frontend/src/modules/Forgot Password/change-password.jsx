import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ELI from "../../assets/img/accounting logo.svg";
import "../../assets/css/style.css";
import swal from "sweetalert";
import axios from "axios";
import BASE_URL from "../../assets/global/url";

const ChangePassword = () => {
  const navigate = useNavigate();
  // new password
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  //   confirm password
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

  // get email
  const location = useLocation();
  const { email } = location.state || {};

  const handleSubmit = async (e) => {
    if (password === confirmPassword) {
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
              .post(BASE_URL + "/forgotPassword/changePassword", {
                password,
                email,
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
                } else {
                  swal({
                    title: "Something Went Wrong",
                    text: "Please contact our support team",
                    icon: "error",
                  });
                }
              })
              .catch((error) => {
                swal({
                  title: "Something Went Wrong",
                  text: "Please contact our support team",
                  icon: "error",
                });
              });
          } catch (error) {
            console.error("Error adding currency:", error);
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
    } else {
      swal({
        title: "Password not matched",
        text: "Please check your password",
        icon: "warning",
        buttons: false,
        timer: 2000,
      });
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 login-container">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="bg-white p-4 p-md-5 custom-login-form shadow">
              <div className="text-center mb-4">
                <img
                  src={ELI}
                  alt="Company Logo"
                  className="img-fluid"
                  style={{ maxWidth: "250px", width: "100%" }}
                />
              </div>
              <div className="text-center mb-4">
                <h1 className="mb-2 fs-3">Create new password</h1>
                <p className="text-muted fs-5">
                  Enter your new password to complete the change password
                  process
                </p>
              </div>

              <div className="mb-3 position-relative password-container">
                <label htmlFor="password" className="form-label fs-5">
                  New Password
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

              <div className="mb-3 position-relative password-container">
                <label htmlFor="password" className="form-label fs-5">
                  Confirm Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control form-control-lg"
                  id="password"
                  placeholder="Enter Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <i
                  className={`fa-solid ${
                    showConfirmPassword ? "fa-eye" : "fa-eye-slash"
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

              <div className="text-end mb-3">
                <Link to="/" className="text-decoration-none fs-5 text-end">
                  Login?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
