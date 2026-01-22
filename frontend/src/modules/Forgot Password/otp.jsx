import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ELI from "../../assets/img/accounting logo.jpg";
import "../../assets/css/style.css";
import swal from "sweetalert";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
const OTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { otpCode, toSendEmail } = location.state || {};
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [inputOTP, setInputOTP] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(120); // Countdown timer starts at 120 seconds (2 minutes)
  const [resendEnabled, setResendEnabled] = useState(false);

  const generateRandomNumber = () => {
    return Math.floor(1000 + Math.random() * 9000);
  };

  useEffect(() => {
    if (otpCode) {
      // Split the otpCode into individual digits and set it to the otp state
      setOtp(otpCode.toString().split(""));
    }
  }, [otpCode]);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else {
      setResendEnabled(true); // Enable resend button when timer reaches 0
    }
  }, [timer]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    const newOtp = [...inputOTP];

    if (/^\d?$/.test(value)) {
      newOtp[index] = value;
      setInputOTP(newOtp);

      if (value && index < inputOTP.length - 1) {
        document.getElementById(`otp-input-${index + 1}`).focus();
      }
    } else if (e.key === "Backspace" && !value) {
      if (index > 0) {
        document.getElementById(`otp-input-${index - 1}`).focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !inputOTP[index]) {
      if (index > 0) {
        document.getElementById(`otp-input-${index - 1}`).focus();
      }
    }
  };

  const handleResend = () => {
    // Logic to resend OTP goes here

    const code = generateRandomNumber();
    axios
      .post(BASE_URL + "/forgotPassword/sentOtp", {
        toSendEmail,
        code,
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
            setOtp(code.toString().split(""));
            setTimer(120); // Reset timer to 120 seconds
            setResendEnabled(false); // Disable resend button again
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputOtpString = inputOTP.join("");
    const otpString = otp.join("");

    if (inputOtpString === otpString) {
      // You can add your logic here to navigate or perform other actions
      swal({
        title: "Success!",
        text: "You may now change your password",
        icon: "success",
        buttons: false,
        timer: 2000,
      }).then(() => {
        navigate("/change-password", {
          state: { email: toSendEmail },
        });
      });
    } else {
      swal({
        title: "Wrong OTP!",
        text: "Please check your e-mail",
        icon: "error",
        buttons: false,
        timer: 2000,
      });
    }
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
                <h1 className="mb-2 fs-3">OTP Verification</h1>
                <p className="text-muted fs-5">Enter Verification Code</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-3 px-4">
                  <label htmlFor="otp" className="form-label fs-5">
                    OTP Code
                  </label>
                  <div className="d-flex justify-content-between">
                    {inputOTP.map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        id={`otp-input-${index}`}
                        className="form-control text-center otp-input fs-4"
                        maxLength="1"
                        value={inputOTP[index]}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                      />
                    ))}
                  </div>
                </div>

                <div className="d-grid mb-3">
                  <button type="submit" className="btn btn-primary btn-lg">
                    Submit
                  </button>
                </div>
                <div className="text-center">
                  {resendEnabled ? (
                    <button
                      onClick={handleResend}
                      className="btn btn-link fs-5"
                      type="button"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span className="fs-5">Resend in {timer} seconds</span>
                  )}
                </div>
                <div className="text-end mb-3">
                  <Link to="/" className="text-decoration-none fs-5 text-end">
                    Login?
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTP;
