import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import BASE_URL from "../../assets/global/url";
import { Link, useNavigate } from "react-router-dom";
import ELI from "../../assets/img/accounting logo.jpg";
import swal from "sweetalert";
import "../../assets/css/style.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // otp
  const [OtpSent, setOtpSent] = useState("");
  const [OtpInput, setOtpInput] = useState("");
  const generateRandomNumber = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };

  const handleSubmit = async (e) => {
    swal({
      title: "Are you sure?",
      text: "Verify this e-mail",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((confirmed) => {
      if (confirmed) {
        setIsSubmitting(true);

        try {
          axios
            .post(BASE_URL + "/forgotPassword/verifyEmail", {
              email,
            })
            .then((res) => {
              if (res.status === 200) {
                const code = generateRandomNumber();
                setOtpSent(code);
                axios
                  .post(BASE_URL + "/forgotPassword/sentOtp", {
                    code,
                    toSendEmail: email,
                  })
                  .then((response) => {
                    if (response.status === 200) {
                      swal({
                        title: "OTP Sent!",
                        text: "OTP has been sent to the e-mail",
                        icon: "success",
                        buttons: false,
                        timer: 2000,
                      }).then(() => {
                        navigate("/OTP", {
                          state: { otpCode: code, toSendEmail: email },
                        });
                      });
                    } else {
                      swal({
                        title: "Something Went Wrong",
                        text: "Please contact our support teams",
                        icon: "error",
                      });
                      setIsSubmitting(false);
                    }
                  })
                  .catch((error) => {
                    swal({
                      title: "Something Went Wrong",
                      text: "Please contact our support teamx",
                      icon: "error",
                    });
                    setIsSubmitting(false);
                  });
              } else if (res.status === 201) {
                swal({
                  title: "Error!",
                  text: "E-mail is not on our Records.",
                  icon: "error",
                  buttons: false,
                  timer: 2000,
                });
                setIsSubmitting(false);
              }
            });
        } catch (error) {
          swal({
            title: "Error!",
            text: "Something went wrong.",
            icon: "error",
            buttons: false,
            timer: 2000,
          });
          setIsSubmitting(false);
        }
      }
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
                <h1 className="mb-2 fs-3">Forgot Password</h1>
                <p className="text-muted fs-5">OTP Verification</p>
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label fs-5">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control form-control-lg"
                  id="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="d-grid mb-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn btn-primary btn-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <>Submitting...</> : <>Submit</>}
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

export default ForgotPassword;
