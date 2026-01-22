// IndividualForm.jsx

import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import swal from "sweetalert";
import CustomDatePicker from "../../components/CustomDatePicker";

const CompanyForm = ({
  openFromCustomerUpdate,
  authrztn,
  countryOptions,
  statusOptions,
  setFirstName,
  firstName,
  setLastName,
  lastName,
  setEmail,
  email,
  setCompanyAddress,
  companyAddress,
  setCountry,
  destination,
  setDestination,
  country,
  setCivilStatus,
  civilStatus,
  setBirthDate,
  birthDate,
  setGender,
  gender,
  setMobileNumber,
  mobileNumber,
  setJobPosition,
  jobPosition,
  setTin,
  tin,
  setCompanyName,
  companyName,
  setCompanyNature,
  companyNature,
  setCompanyEmail,
  companyEmail,
  setNotes,
  notes,
  validated,
  months,
  years,
  yearRef,
  selectYear,
  setSelectYear,
  yearList,
  decreaseYear,
  increaseYear,
  generateYears,
}) => {
  const [companyEmailError, setCompanyEmailError] = useState("");
  let isEditable = false;

  if (openFromCustomerUpdate === true) {
    isEditable = authrztn.includes("Customers-Edit") ? false : true;
  }

  const validateCompanyEmail = (e) => {
    const value = e.target.value;
    setCompanyEmail(value);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setCompanyEmailError("Please enter a valid email address.");
    } else {
      setCompanyEmailError("");
    }
  };

  const handleResetToToday = (changeYear, changeMonth) => {
    const currentYear = new Date().getFullYear();

    setBirthDate(new Date());

    generateYears(); // Reset Year List

    changeYear(currentYear); // Set year

    changeMonth(
      months.indexOf(
        months[new Date().getMonth()] // Set month
      )
    );
  };

  const handleDateChange = (date) => {
    const today = new Date();

    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    if (isToday) {
      swal({
        icon: "warning",
        title: "Invalid Birth Date",
        text: "Birth date cannot be today's date. Please select a valid past date.",
      });

      return;
    }

    setBirthDate(date);
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(
    ({ value, onClick, disabled, generateYears }, ref) => (
      <input
        type="text"
        className="form-control w-100"
        style={{ cursor: "pointer", caretColor: "transparent" }}
        onClick={() => {
          onClick();

          const dateOfBirth = new Date(birthDate).getFullYear();

          generateYears(dateOfBirth); // Reset/Initialize Year List based on selected date of birth
        }}
        value={value}
        ref={ref}
        placeholder="Select Date"
        disabled={disabled}
      />
    )
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setSelectYear(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Company Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              disabled={isEditable}
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Company Nature <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              disabled={isEditable}
              type="text"
              value={companyNature}
              onChange={(e) => setCompanyNature(e.target.value)}
              required
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Company Email
              {/* <span className="text-danger">*</span> */}
            </Form.Label>
            <Form.Control
              disabled={isEditable}
              type="email"
              value={companyEmail}
              onChange={validateCompanyEmail}
              // required
            />
            {companyEmailError && (
              <div className="text-danger">{companyEmailError}</div>
            )}
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
              disabled={isEditable}
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
              disabled={isEditable}
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
        <div className="col-sm">
          <Form.Group className="mb-3" controlId="basedCurrency">
            <Form.Label>Destination</Form.Label>
            <Form.Select
              defaultValue="Philippines"
              disabled={isEditable}
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option disabled value="">
                Select Destination
              </option>
              <option value="Local">Local</option>
              <option value="Overseas">Overseas</option>
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>
              Mobile No. <span className="text-danger">*</span>
            </Form.Label>
            <div className="input-group">
              <span className="input-group-text">+63</span>
              <Form.Control
                disabled={isEditable}
                type="text"
                required
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

      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              disabled={isEditable}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              disabled={isEditable}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              disabled={isEditable}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3" controlId="basedCurrency">
            <Form.Label>Civil Status</Form.Label>
            <Form.Select
              disabled={isEditable}
              value={civilStatus}
              onChange={(e) => setCivilStatus(e.target.value)}
            >
              <option value="" disabled>
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
            {/* <Form.Control
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            /> */}
            <CustomDatePicker
              label={"Birthday"}
              selected={birthDate ? new Date(birthDate) : null}
              handleDateChange={handleDateChange}
              CustomInput={CustomInput}
              disabled={isEditable}
              validated={validated}
              iconTopOffset={"0.7rem"}
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Gender</Form.Label>
            <div className="d-flex align-items-center">
              <Form.Check
                disabled={isEditable}
                className="me-2"
                type="radio"
                label="Male"
                name="gender"
                id="genderMale"
                value="Male"
                checked={gender && gender === "Male"}
                onChange={(e) => setGender(e.target.value)}
              />
              <Form.Check
                disabled={isEditable}
                className="me-2"
                type="radio"
                label="Female"
                name="gender"
                id="genderFemale"
                value="Female"
                checked={gender && gender === "Female"}
                onChange={(e) => setGender(e.target.value)}
              />
            </div>
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Job Position</Form.Label>
            <Form.Control
              disabled={isEditable}
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
              disabled={isEditable}
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
            />
          </Form.Group>
        </div>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <Form.Label>Internal Notes</Form.Label>
            <Form.Control
              disabled={isEditable}
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Form.Group>
        </div>
      </div>
    </>
  );
};

export default CompanyForm;
