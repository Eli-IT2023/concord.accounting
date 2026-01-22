import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Tab, Tabs } from "react-bootstrap";
import PurchaseProductTab from "./Tab/PurchaseProductTab";
import SoldProductTab from "./Tab/SoldProductTab";
import IndividualForm from "./IndividualForm";
import CompanyForm from "./CompanyForm";
import DataTable from "react-data-table-component";
import { customStyles } from "../styles/table-style";
import { useParams } from "react-router-dom";
import BASE_URL from "../../assets/global/url";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { useLocation } from "react-router-dom";

function CustomerUpdate({ authrztn }) {
  const { id } = useParams();
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const yearRef = useRef();

  const [customerCashWallet, setCustomerCashWallet] = useState([]);
  const location = useLocation();
  const [validated, setValidated] = useState(false);

  const [formType, setFormType] = useState("");
  const [status, setStatus] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [destination, setDestination] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [tin, setTin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNature, setCompanyNature] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [balance, setBalance] = useState("");

  const [updateFormData, setUpdateFormData] = useState({
    customerId: "",
    formType: "",
    firstName: "",
    lastName: "",
    email: "",
    companyAddress: "",
    country: "",
    civilStatus: "",
    birthDate: "",
    gender: "",
    mobileNumber: "",
    jobPosition: "",
    tin: "",
    companyName: "",
    companyNature: "",
    companyEmail: "",
    notes: "",
  });

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

  const [cashWith, setCashWith] = useState("");
  const [amount, setAmount] = useState(0);
  const [checkNumber, setCheckNumber] = useState("");
  const [cashWallet, setCashWallet] = useState([]);

  const FetchCustomerCashWallet = () => {
    axios
      .get(BASE_URL + `/customer/getCustomerCashWallet/${id}`)
      .then((res) => {
        setCustomerCashWallet(res.data);
      });
  };
  useEffect(() => {
    FetchCustomerCashWallet();
  }, []);

  const columns = [
    {
      name: "Type",
      selector: (row) => row.cashType,
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
      selector: (row) => row.issuedDate,
    },
  ];

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

  const combinedWallet = [...customerCashWallet, ...cashWallet];

  const userData = combinedWallet.map((data, i) => ({
    key: i,
    cashType: data.cash_type || data.type,
    amount: data.amount,
    checkNumber: data.check_number || data.checkNumber,
    issuedDate: data.createAt || data.issuedDate,
  }));

  useEffect(() => {
    axios
      .get(`${BASE_URL}/customer/getCustomerDetails`, {
        params: { customerId: id },
      })
      .then((res) => {
        setFormType(res.data.type);
        setStatus(res.data.status);
        setFirstName(res.data.first_name);
        setLastName(res.data.last_name);
        setEmail(res.data.email);
        setCompanyAddress(res.data.company_address);
        setCountry(res.data.country);
        setDestination(res.data.destination);
        setCivilStatus(res.data.civil_status);
        setBirthDate(res.data.date_birth);
        setGender(res.data.gender);
        setMobileNumber(res.data.mobile_no);
        setJobPosition(res.data.job_position);
        setTin(res.data.tin);
        setCompanyName(res.data.company_name);
        setCompanyNature(res.data.company_nature);
        setCompanyEmail(res.data.company_email);
        setNotes(res.data.notes);
        setBalance(res.data.balance);
      })
      .catch((error) => {
        console.error("Error fetching customer details: ", error);
      });
  }, [id]);

  const handleBack = () => {
    const fromState = location.state?.from;

    if (fromState === "sales-report") {
      navigate("/reports/new-report/sales_report");
    } else {
      navigate("/sales/customers");
    }

    setFormType("");
    setStatus("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setCompanyAddress("");
    setCountry("");
    setCivilStatus("");
    setBirthDate("");
    setGender("");
    setMobileNumber("");
    setJobPosition("");
    setTin("");
    setCompanyName("");
    setCompanyNature("");
    setCompanyEmail("");
    setNotes("");
    setBalance("");
  };

  const updateCustomer = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      swal({
        icon: "error",
        title: "Name is required",
        text: "Please enter a name before updating.",
      });
      return;
    }
    try {
      const response = await axios.put(
        `${BASE_URL}/customer/updateCustomer/${id}`,
        {
          status: status,
          firstName: firstName,
          lastName: lastName,
          email: email,
          companyAddress: companyAddress,
          country: country,
          destination: destination,
          civilStatus: civilStatus,
          birthDate: birthDate,
          gender: gender,
          mobileNumber: mobileNumber,
          jobPosition: jobPosition,
          tin: tin,
          companyName: companyName,
          companyNature: companyNature,
          companyEmail: companyEmail,
          notes: notes,
          cashWallet: cashWallet,
          formType,
          userLoggedID,
        }
      );

      if (response.status === 200) {
        swal({
          title: "Update successful!",
          text: "The Customer has been updated successfully.",
          icon: "success",
          button: "OK",
        }).then(() => {
          setUpdateFormData({
            customerId: "",
            formType: "",
            firstName: "",
            lastName: "",
            email: "",
            companyAddress: "",
            country: "",
            civilStatus: "",
            birthDate: "",
            gender: "",
            mobileNumber: "",
            jobPosition: "",
            tin: "",
            companyName: "",
            companyNature: "",
            companyEmail: "",
            notes: "",
          });

          navigate("/sales/customers");
        });
      } else if (response.status === 202) {
        swal({
          icon: "error",
          title: "Customer has been already exists",
          text: "Please input another Customer Name",
        });
      } else {
        swal({
          icon: "error",
          title: "Something went wrong",
          text: "Please contact our support",
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <button
              onClick={handleBack}
              className="text-dark mx-2 btn btn-link p-0 border-0"
              style={{ textDecoration: "none" }}
            >
              <i class="fa-solid fa-arrow-left fs-4"></i>
            </button>
            CUSTOMER DETAILS
          </span>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={updateCustomer}>
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
                  disabled={!authrztn.includes("Customers-Edit")}
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
            openFromCustomerUpdate={true}
            authrztn={authrztn}
            countryOptions={countryOptions}
            statusOptions={statusOptions}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={email}
            setEmail={setEmail}
            companyAddress={companyAddress}
            setCompanyAddress={setCompanyAddress}
            country={country}
            setCountry={setCountry}
            destination={destination}
            setDestination={setDestination}
            civilStatus={civilStatus}
            setCivilStatus={setCivilStatus}
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            gender={gender}
            setGender={setGender}
            mobileNumber={mobileNumber}
            setMobileNumber={setMobileNumber}
            jobPosition={jobPosition}
            setJobPosition={setJobPosition}
            tin={tin}
            setTin={setTin}
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
            openFromCustomerUpdate={true}
            authrztn={authrztn}
            countryOptions={countryOptions}
            statusOptions={statusOptions}
            setFirstName={setFirstName}
            firstName={firstName}
            setLastName={setLastName}
            lastName={lastName}
            setEmail={setEmail}
            email={email}
            setCompanyAddress={setCompanyAddress}
            companyAddress={companyAddress}
            setCountry={setCountry}
            destination={destination}
            setDestination={setDestination}
            country={country}
            setCivilStatus={setCivilStatus}
            civilStatus={civilStatus}
            setBirthDate={setBirthDate}
            birthDate={birthDate}
            setGender={setGender}
            gender={gender}
            setMobileNumber={setMobileNumber}
            mobileNumber={mobileNumber}
            setJobPosition={setJobPosition}
            jobPosition={jobPosition}
            setTin={setTin}
            tin={tin}
            setCompanyName={setCompanyName}
            companyName={companyName}
            setCompanyNature={setCompanyNature}
            companyNature={companyNature}
            setCompanyEmail={setCompanyEmail}
            companyEmail={companyEmail}
            setNotes={setNotes}
            notes={notes}
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

        {/* TABS SECTION */}
        <Tabs defaultActiveKey="purchase" id="customer-tabs" className="mb-3">
          <Tab eventKey="purchase" title="Sold Transactions">
            <div className="mt-4">
              <PurchaseProductTab customerId={id} />
            </div>
          </Tab>
        </Tabs>

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
                  data={userData}
                  customStyles={customStyles}
                />
              </div>
              <div className="d-flex flex-column title-custom align-items-end">
                <span className="align-self-end">Cash Balance</span>
                <span className="fs-2 text-end" style={{ color: "green" }}>
                  ₱ {balance}
                </span>
              </div>
            </div>
          </div>
        </div> */}

        <br></br>
        {authrztn.includes("Customers-Edit") && (
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
        )}
      </Form>
    </div>
  );
}

export default CustomerUpdate;
