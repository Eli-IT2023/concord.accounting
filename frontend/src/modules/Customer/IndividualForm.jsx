import React, { useState } from "react";
import { Form } from "react-bootstrap";

const IndividualForm = ({
  countryOptions,
  statusOptions,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  companyAddress,
  setCompanyAddress,
  country,
  setCountry,
  civilStatus,
  setCivilStatus,
  birthDate,
  setBirthDate,
  gender,
  setGender,
  mobileNumber,
  setMobileNumber,
  jobPosition,
  setJobPosition,
  tin,
  setTin,
}) => {
  const [emailError, setEmailError] = useState("");

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Invalid email address");
    } else {
      setEmailError(""); // Clear the error if the email is valid
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              First Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="firstName"
              placeholder="Enter First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Last Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Email Address <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={handleEmailChange} // Updated to use handleEmailChange
              required
            />
            {emailError && <small className="text-danger">{emailError}</small>}{" "}
            {/* Display error */}
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Company Address <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              required
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3" controlId="basedCurrency">
            <Form.Label>Country</Form.Label>
            <Form.Select
              defaultValue="Philippines"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option disabled value="">
                Select Country
              </option>
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3" controlId="basedCurrency">
            <Form.Label>
              Civil Status <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              required
              value={civilStatus}
              onChange={(e) => setCivilStatus(e.target.value)}
            >
              <option disabled value="">
                Select Status
              </option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Date of Birth</Form.Label>
            <Form.Control
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Gender <span className="text-danger">*</span>
            </Form.Label>
            <div className="d-flex align-items-center">
              <Form.Check
                className="me-2"
                type="radio"
                label="Male"
                name="gender"
                id="genderMale"
                value="Male"
                required
                checked={gender && gender === "Male"}
                onChange={(e) => setGender(e.target.value)}
              />
              <Form.Check
                className="me-2"
                type="radio"
                label="Female"
                name="gender"
                id="genderFemale"
                value="Female"
                required
                checked={gender && gender === "Female"}
                onChange={(e) => setGender(e.target.value)}
              />
            </div>
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="row">
          <div className="col-sm">
            <Form.Group className="mb-3">
              <Form.Label>Mobile No.</Form.Label>
              <div className="input-group">
                <span className="input-group-text">+63</span>
                <Form.Control
                  type="text"
                  maxLength={10} // Limit to 10 digits
                  value={mobileNumber}
                  onKeyPress={(e) => {
                    // Allow only numbers
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>
            </Form.Group>
          </div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
        </div>

        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Job Position</Form.Label>
            <Form.Control
              type="text"
              value={jobPosition}
              onChange={(e) => setJobPosition(e.target.value)}
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>TIN</Form.Label>
            <Form.Control
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
            />
          </Form.Group>
        </div>
      </div>
    </>
  );
};

export default IndividualForm;
