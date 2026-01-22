import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import "../../assets/css/style.css";
import IndividualForm from "./IndividualForm";
import CompanyForm from "./CompanyForm";
import swal from "sweetalert";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { v4 as uuidv4 } from "uuid";

const CustomerCreate = () => {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const userLoggedID = useDecodeToken();

  // Form state
  const [formType, setFormType] = useState("company");
  const [status, setStatus] = useState(true);
  const [companyAddress, setCompanyAddress] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [mobileNumber, setMobileNumber] = useState("");
  const [tin, setTin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNature, setCompanyNature] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [telephoneNumber, setTelephoneNumber] = useState("");
  const [currencyID, setCurrencyID] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [otherPaymentTerms, setOtherPaymentTerms] = useState("");
  const [vatPercentage, setVatPercentage] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountIDNo, setDiscountIDNo] = useState(0);

  // Social links and contact person
  const uuid = uuidv4();
  const [socialLinks, setSocialLinks] = React.useState([
    {
      id: uuid,
      platform: "",
      link: "",
      isDeleted: false,
    },
  ]);

  const [contactPerson, setContactPerson] = React.useState([
    {
      id: uuid,
      fname: "",
      mname: "",
      lname: " ",
      email: "",
      jobPosition: "",
      mobileNumber: "",
      Remarks: "",
      isDeleted: false,
    },
  ]);

  // Options
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
        status: status,
        companyName: companyName,
        companyNature: companyNature,
        companyEmail: companyEmail,
        companyAddress: companyAddress,
        country: country,
        mobileNumber: mobileNumber,
        telephoneNumber: telephoneNumber,
        tin: tin,
        socialLinks: socialLinks.filter((link) => !link.isDeleted),
        contactPerson: contactPerson.filter((person) => !person.isDeleted),
        currencyID: currencyID,
        paymentMethod: paymentMethod,
        paymentTerms: paymentTerms,
        otherPaymentTerms: otherPaymentTerms,
        vatPercentage: vatPercentage || 0,
        discountIDNo: discountIDNo,
        discountPercentage: discountPercentage || 0,
        userLoggedID,
      };

      // Add this console.log to see the data before sending
      console.log("Customer Data to be submitted:", customerData);

      try {
        const res = await axios.post(
          `${BASE_URL}/customer/create`,
          customerData
        );

        console.log("Server response:", res.data);

        if (res.status === 200) {
          swal({
            title: "Added New Customer",
            text: "The Customer has been added successfully",
            icon: "success",
            button: "OK",
          }).then(() => {
            navigate("/sales/customers");
          });
        } else if (res.status === 201) {
          swal({
            title: "Customer is Already Exist",
            text: "Change the customer name",
            icon: "error",
            button: "OK",
          });
        }
      } catch (error) {
        // Log any errors that occur
        console.error("Error creating customer:", error);
        swal({
          title: "Something went wrong",
          text: "Please Contact our Support",
          icon: "error",
          button: "OK",
        });
      }
    }
    setValidated(true);
  };

  const handleBack = () => {
    navigate("/sales/customers");
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/sales/customers" className="text-dark mx-2">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            CREATE
          </span>
          <span>GENERAL INFORMATION</span>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={createCustomer}>
        <div className="row">
          <div className="col-sm">
            <Form.Group>
              <label htmlFor="status">Status</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="status"
                  checked={status}
                  onChange={(e) => setStatus(e.target.checked)}
                />
                <label htmlFor="status">Toggle on to Active</label>
              </div>
            </Form.Group>
          </div>
        </div>

        <CompanyForm
          countryOptions={countryOptions}
          setCompanyAddress={setCompanyAddress}
          companyAddress={companyAddress}
          setCountry={setCountry}
          country={country}
          setMobileNumber={setMobileNumber}
          mobileNumber={mobileNumber}
          setTin={setTin}
          tin={tin}
          setCompanyName={setCompanyName}
          companyName={companyName}
          setCompanyNature={setCompanyNature}
          companyNature={companyNature}
          setCompanyEmail={setCompanyEmail}
          companyEmail={companyEmail}
          socialLinks={socialLinks}
          setSocialLinks={setSocialLinks}
          contactPerson={contactPerson}
          setContactPerson={setContactPerson}
          setTelephoneNumber={setTelephoneNumber}
          telephoneNumber={telephoneNumber}
          currencyID={currencyID}
          setCurrencyID={setCurrencyID}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paymentTerms={paymentTerms}
          setPaymentTerms={setPaymentTerms}
          otherPaymentTerms={otherPaymentTerms}
          setOtherPaymentTerms={setOtherPaymentTerms}
          vatPercentage={vatPercentage}
          setVatPercentage={setVatPercentage}
          discountPercentage={discountPercentage}
          setDiscountPercentage={setDiscountPercentage}
          discountIDNo={discountIDNo}
          setDiscountIDNo={setDiscountIDNo}
        />

        <div className="d-flex justify-content-end mt-4">
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
};

export default CustomerCreate;
