import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Button, Form } from "react-bootstrap";
import "../../assets/css/style.css";
import { customStyles } from "../styles/table-style";
import IndividualForm from "./IndividualForm";
import CompanyForm from "./CompanyForm";
import swal from "sweetalert";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

function CustomerCreate({ authrztn }) {
  const navigate = useNavigate();
  const yearRef = useRef();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [validated, setValidated] = useState(false);
  const userLoggedID = useDecodeToken();

  const [formType, setFormType] = useState("individual");
  const [status, setStatus] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [destination, setDestination] = useState("Local");
  const [civilStatus, setCivilStatus] = useState("");
  const [birthDate, setBirthDate] = useState(null);
  const [gender, setGender] = useState("Male");
  const [mobileNumber, setMobileNumber] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [tin, setTin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNature, setCompanyNature] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [cashWith, setCashWith] = useState("");
  const [amount, setAmount] = useState(0);
  const [checkNumber, setCheckNumber] = useState("");
  const [cashWallet, setCashWallet] = useState([]);
  const [selectYear, setSelectYear] = useState(false);
  const [yearList, setYearList] = useState([]);

  const generateYears = (year) => {
    setYearList(() => {
      const updated = [];
      const currentYear = new Date().getFullYear();

      // Generate years based on current year or selected year
      const yearList = Array.from(
        { length: 16 },
        (_, i) => (year ? year : currentYear) - 16 + i + 1
      );

      // Divide array by 4 items
      for (let i = 0; i < yearList.length; i += 4) {
        updated.push(yearList.slice(i, i + 4));
      }

      return updated;
    });
  };

  const increaseYear = (changeYear) => {
    setYearList((prev) => {
      const updated = prev.map((item) => item.map((year) => year + 10));
      changeYear(updated[3][3]);

      return updated;
    });
  };

  const decreaseYear = (changeYear) => {
    setYearList((prev) => {
      const updated = prev.map((item) => item.map((year) => year - 10));
      changeYear(updated[3][3]);

      return updated;
    });
  };

  function range(start, end, step = 1) {
    const result = [];
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
    return result;
  }

  const years = range(1900, new Date().getFullYear() + 1, 1);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const countryOptions = [
    { value: "Philippines", label: "Philippines" },
    { value: "China", label: "China" },
    { value: "USA", label: "USA" },
    { value: "RUSSIA", label: "RUSSIA" },
    { value: "SINGAPORE", label: "SINGAPORE" },
    { value: "JAPAN", label: "JAPAN" },
  ];

  const statusOptions = [
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Divorced", label: "Divorced" },
    { value: "Widowed", label: "Widowed" },
  ];

  const columns = [
    {
      name: "Type",
      selector: (row) => row.type,
    },
    {
      name: "Amount",
      selector: (row) => row.amount,
    },
    {
      name: "Check Number",
      selector: (row) => row.checkNumber,
    },
    {
      name: "Issue Date",
      selector: (row) => row.name,
    },
  ];

  // Create Customer
  const createCustomer = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
      swal({
        icon: "error",
        title: "Fields are required",
        text: "Please fill the red text fields",
      });
    } else {
      const customerData = {
        type: formType,
        status: status,
        firstName: firstName,
        lastName: lastName,
        email: email,
        companyAddress: companyAddress,
        country: country,
        destination: destination,
        civilStatus: civilStatus || null,
        birthDate: birthDate || null,
        gender: gender,
        mobileNumber: mobileNumber,
        jobPosition: jobPosition,
        tin: tin,
        companyName: companyName,
        companyNature: companyNature,
        companyEmail: companyEmail,
        notes: notes,
        cashWallet: cashWallet,
        userLoggedID,
      };

      axios.post(`${BASE_URL}/customer/create`, customerData).then((res) => {
        if (res.status === 200) {
          SuccessInserted(res);
        } else if (res.status === 201) {
          Duplicate_Message();
        } else {
          ErrorInserted();
        }
      });
    }
    setValidated(true);
  };

  //Validations
  const SuccessInserted = (res) => {
    swal({
      title: "Added New Customer",
      text: "The Customer has been added successfully",
      icon: "success",
      button: "OK",
    }).then(() => {
      setFormType("");
      setStatus("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setCompanyAddress("");
      setCountry("");
      setCivilStatus("");
      setBirthDate("null");
      setGender("Male");
      setMobileNumber("");
      setJobPosition("");
      setTin("");
      setCompanyName("");
      setCompanyNature("");
      setCompanyEmail("");
      setNotes("");
      // reloadTable();
      navigate("/sales/customers");
    });
  };

  const Duplicate_Message = () => {
    swal({
      title: "Customer is Already Exist",
      text: "Change the customer name",
      icon: "error",
      button: "OK",
    });
  };

  const ErrorInserted = () => {
    swal({
      title: "Something went wrong",
      text: "Please Contact our Support",
      icon: "error",
      button: "OK",
    });
  };

  //Reload Table
  // const reloadTable = () => {
  //   axios
  //     .get(BASE_URL + "/customer/getCustomers")
  //     .then((res) => {
  //       const sortedCustomerList = res.data.sort(
  //         (a, b) => b.customer_id - a.customer_id
  //       );
  //       setInboundData(sortedCustomerList);
  //     })
  //     .catch((err) => console.log(err));
  // };

  // useEffect(() => {
  //   reloadTable();
  // }, []);

  const handleBack = () => {
    setFormType("");
    setStatus("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setCompanyAddress("");
    setCountry("");
    setCivilStatus("");
    setBirthDate("");
    setGender("Male");
    setMobileNumber("");
    setJobPosition("");
    setTin("");
    setCompanyName("");
    setCompanyNature("");
    setCompanyEmail("");
    setNotes("");

    navigate("/sales/customers");
  };

  const handleAddCash = () => {
    const newEntry = {
      type: cashWith,
      amount: amount,
      checkNumber: checkNumber,
    };
    setCashWallet([...cashWallet, newEntry]);

    setCashWith("");
    setAmount(0);
    setCheckNumber("");
  };

  const totalAmount = cashWallet.reduce(
    (acc, entry) => acc + parseFloat(entry.amount || 0),
    0
  );

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/sales/customers" className="text-dark mx-2">
              <i class="fa-solid fa-arrow-left"></i>
            </Link>
            CREATE CUSTOMER
          </span>
          <span>GENERAL INFORMATION</span>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={createCustomer}>
        <div className="col-sm">
          <Form.Group className="mb-3">
            <div className="d-flex align-items-center">
              <Form.Check
                className="me-2"
                type="radio"
                label="INDIVIDUAL"
                name="generalInfo"
                id="individual"
                value="individual"
                checked={formType === "individual"}
                onChange={() => setFormType("individual")}
              />
              <Form.Check
                className="me-3"
                type="radio"
                label="COMPANY"
                name="generalInfo"
                id="company"
                value="company"
                checked={formType === "company"}
                onChange={() => setFormType("company")}
              />
            </div>
          </Form.Group>
        </div>

        <div className="row">
          <div className=" col-sm">
            <Form.Group>
              <label htmlFor="status">Status</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="status"
                  checked={status === true}
                  onChange={(e) => setStatus(!status)}
                />
                <label htmlFor="status">Toggle on to Active</label>
              </div>
            </Form.Group>
            <div className="mt-4"></div>
          </div>
          <div className="col-sm"></div>
        </div>

        {formType === "individual" && (
          <IndividualForm
            openFromCustomerUpdate={false}
            authrztn={authrztn}
            countryOptions={countryOptions}
            statusOptions={statusOptions}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setEmail={setEmail}
            setCompanyAddress={setCompanyAddress}
            setCountry={setCountry}
            setDestination={setDestination}
            setCivilStatus={setCivilStatus}
            setBirthDate={setBirthDate}
            birthDate={birthDate}
            setGender={setGender}
            setMobileNumber={setMobileNumber}
            setJobPosition={setJobPosition}
            setTin={setTin}
            validated={validated}
            months={months}
            years={years}
            yearRef={yearRef}
            selectYear={selectYear}
            setSelectYear={setSelectYear}
            yearList={yearList}
            decreaseYear={decreaseYear}
            increaseYear={increaseYear}
            generateYears={generateYears}
          />
        )}
        {formType === "company" && (
          <CompanyForm
            openFromCustomerUpdate={false}
            authrztn={authrztn}
            countryOptions={countryOptions}
            statusOptions={statusOptions}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setEmail={setEmail}
            setCompanyAddress={setCompanyAddress}
            setCountry={setCountry}
            setDestination={setDestination}
            setCivilStatus={setCivilStatus}
            setBirthDate={setBirthDate}
            birthDate={birthDate}
            setGender={setGender}
            setMobileNumber={setMobileNumber}
            setJobPosition={setJobPosition}
            setTin={setTin}
            setCompanyName={setCompanyName}
            setCompanyNature={setCompanyNature}
            setCompanyEmail={setCompanyEmail}
            setNotes={setNotes}
            validated={validated}
            months={months}
            years={years}
            yearRef={yearRef}
            selectYear={selectYear}
            setSelectYear={setSelectYear}
            yearList={yearList}
            decreaseYear={decreaseYear}
            increaseYear={increaseYear}
            generateYears={generateYears}
          />
        )}

        <div className="mt-5"></div>

        {/* <div className="row mt-3">
          <div className="col">
            <h2 className="mb-0">Cash Wallet</h2>
            <div className="border-bottom border-2 mt-2"></div>
            <div className="mt-5"></div>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-4">
            <div className="border bg-white custom-container">
              <div className="w-100 p-2 d-flex flex-row justify-content-between">
                <div className="d-flex flex-column title-custom">
                  <span className="fs-5">Cash</span>
                  <span>Cash Method</span>
                </div>
              </div>
              <div className="border-bottom border-2 mt-2"></div>
              <div className="mt-4"></div>
              <Form.Group className="mb-3">
                <Form.Label>Cash With</Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Check
                    className="me-2"
                    type="radio"
                    label="Cash"
                    name="cashWith"
                    id="cashWithCash"
                    value="Cash"
                    checked={cashWith === "Cash"}
                    onChange={(e) => setCashWith(e.target.value)}
                  />
                  <Form.Check
                    className="me-2"
                    type="radio"
                    label="Check"
                    name="cashWith"
                    id="cashWithCheck"
                    value="Check"
                    checked={cashWith === "Check"}
                    onChange={(e) => setCashWith(e.target.value)}
                  />
                </div>
              </Form.Group>
              {cashWith === "Check" && (
                <Form.Group className="mb-3">
                  <Form.Label>Check Number</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      style={{ cursor: "default" }}
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                    />
                  </div>
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>AMOUNT</Form.Label>
                <div className="input-group">
                  <span className="input-group-text">₱</span>
                  <Form.Control
                    type="text"
                    placeholder="00.0"
                    style={{ cursor: "default" }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </Form.Group>
              <Form.Group>
                <Button
                  variant="primary"
                  className="mx-2"
                  onClick={handleAddCash}
                >
                  Add Cash
                </Button>
              </Form.Group>
            </div>
          </div>

          <div className="col-sm">
            <div className="border bg-white custom-container">
              <div className="w-100 p-2 d-flex flex-row justify-content-between">
                <div className="d-flex flex-column title-custom">
                  <span className="fs-5">Cash</span>
                  <span>Balance</span>
                </div>
              </div>
              <div className="w-100 mt-4 container-fluid">
                <DataTable
                  columns={columns}
                  data={cashWallet}
                  customStyles={customStyles}
                />
              </div>
              <div className="d-flex flex-column title-custom align-items-end">
                <span className="align-self-end">Cash Balance</span>
                <span className="fs-2 text-end" style={{ color: "green" }}>
                  ₱ {totalAmount}
                </span>
              </div>
            </div>
          </div>
        </div> */}

        <br></br>

        <div className="d-flex justify-content-end">
          <Button
            variant="outline-secondary"
            className="mx-2"
            onClick={handleBack}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="mx-2">
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default CustomerCreate;
