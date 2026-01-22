// CustomerUpdate.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button, Form } from "react-bootstrap";
import CompanyForm from "./CompanyForm";
import { useParams } from "react-router-dom";
import BASE_URL from "../../assets/global/url";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { formatPrice, parsePrice } from "../../utils/formatUtils";
import Select from "react-select";

function CustomerUpdate({ authrztn, roleType }) {
  const { id } = useParams();
  const userLoggedID = useDecodeToken();
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const [availableProducts, setAvailableProducts] = useState([]);

  const [validated, setValidated] = useState(false);
  const [formType, setFormType] = useState("company");
  const [status, setStatus] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [mobileNumber, setMobileNumber] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [tin, setTin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNature, setCompanyNature] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [telephoneNumber, setTelephoneNumber] = useState("");
  const [socialLinks, setSocialLinks] = useState([]);
  const [contactPerson, setContactPerson] = useState([]);
  const [customerProducts, setCustomerProducts] = useState([]);
  const [currencyID, setCurrencyID] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [otherPaymentTerms, setOtherPaymentTerms] = useState("");
  const [vatPercentage, setVatPercentage] = useState(0); // Default to 0
  const [discountIDNo, setDiscountIDNo] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0); // Default to 0
  const countryOptions = [
    { value: "Philippines", label: "Philippines" },
    { value: "China", label: "China" },
    { value: "USA", label: "USA" },
    { value: "RUSSIA", label: "RUSSIA" },
    { value: "SINGAPORE", label: "SINGAPORE" },
    { value: "JAPAN", label: "JAPAN" },
  ];

  const [initialData, setInitialData] = useState(null);

  // Fetch customer details and products
  useEffect(() => {
    if (!id || hasFetched.current) return;

    hasFetched.current = true;

    const fetchData = async () => {
      try {
        const [customerRes, productsRes] = await Promise.all([
          axios.get(`${BASE_URL}/customer/getCustomerDetails`, {
            params: { customerId: id },
          }),
          axios.get(`${BASE_URL}/customer/fetchProduct`, { params: { id } }),
        ]);

        const customerData = customerRes.data;
        // Debug log to check what currencyID is coming from the API
        console.log("API returned currencyID:", customerData.currency_id);

        // Set currencyID before any other state that might depend on it
        setCurrencyID(customerData.currency_id || ""); // Empty string if undefined

        const transformedProducts = productsRes.data.map((data) => ({
          customer_prod_id: data.id,
          prod_id: data.ptc_product_id.product_id,
          prod_code: data.ptc_product_id.product_code,
          prod_name: data.ptc_product_id.product_name,
          prod_cat: data.ptc_product_id.product_category,
          prod_uom: data.ptc_product_id.prod_packaging.packaging_name,
          customer_product_code: data.customer_product_code,
          customer_product_name: data.customer_product_name,
          customer_prod_price: data.product_price,
          customer_prod_status: data.status,
          formatted_price: formatPrice(data.product_price),
          type: "old",
        }));

        setInitialData({
          status: customerData.status,
          companyName: customerData.company_name,
          companyNature: customerData.company_nature,
          companyEmail: customerData.company_email,
          companyAddress: customerData.company_address,
          country: customerData.country,
          mobileNumber: customerData.mobile_no,
          telephoneNumber: customerData.telephone_no,
          tin: customerData.tin,
          socialLinks: customerData.customer_social_links,
          contactPerson: customerData.customer_contact_people,
          products: transformedProducts,
          paymentMethod: customerData.payment_method,
          paymentTerms: customerData.payment_terms,
          otherPaymentTerms: customerData.other_payment_terms,
          vatPercentage: customerData.vat_percentage,
          discountIDNo: customerData.discount_id_no,
          discountPercentage: customerData.discount_percentage,
          currencyID: customerData.currency_id,
        });

        // Set all the component states
        setFormType(customerData.type);
        setStatus(customerData.status);
        setCompanyAddress(customerData.company_address);
        setCountry(customerData.country);
        setMobileNumber(customerData.mobile_no);
        setTelephoneNumber(customerData.telephone_no);
        setTin(customerData.tin);
        setCompanyName(customerData.company_name);
        setCompanyNature(customerData.company_nature);
        setCompanyEmail(customerData.company_email);
        setPaymentMethod(customerData.payment_method);
        setPaymentTerms(customerData.payment_terms);
        setVatPercentage(customerData.vat_percentage || 0);
        setDiscountIDNo(customerData.discount_id_no);
        setDiscountPercentage(customerData.discount_percentage || 0);
        setCurrencyID(customerData.currency_id);

        setSocialLinks(
          customerData.customer_social_links.map((link) => ({
            id: link.id,
            platform: link.platform,
            link: link.link,
            isDeleted: false,
          }))
        );

        setContactPerson(
          customerData.customer_contact_people.map((person) => ({
            id: person.id,
            fname: person.fname,
            mname: person.mname,
            lname: person.lname,
            email: person.email,
            jobPosition: person.job_position,
            mobileNumber: person.mobile_no,
            Remarks: person.remarks,
            isDeleted: false,
          }))
        );

        setCustomerProducts(transformedProducts);
      } catch (error) {
        console.error(error);
        swal({
          title: "Error",
          text: "Failed to load customer data",
          icon: "error",
        });
      }
    };

    fetchData();
  }, [id]);

  const updateCustomer = async (e) => {
    e.preventDefault();

    if (!initialData) {
      swal({
        title: "Error",
        text: "Customer data not fully loaded yet",
        icon: "error",
      });
      return;
    }

    // Prepare current data for comparison
    const currentData = {
      status,
      companyName,
      companyNature,
      companyEmail,
      companyAddress,
      country,
      mobileNumber,
      telephoneNumber,
      tin,
      currencyID,
      paymentMethod,
      paymentTerms,
      otherPaymentTerms,
      vatPercentage: vatPercentage || 0, // Add OR operator here for comparison
      discountIDNo,
      discountPercentage: discountPercentage || 0, // Add OR operator here for comparison
      socialLinks: socialLinks
        .filter((link) => !link.isDeleted)
        .map((link) => ({
          id: link.id,
          platform: link.platform,
          link: link.link,
        })),
      contactPerson: contactPerson
        .filter((person) => !person.isDeleted)
        .map((person) => ({
          id: person.id,
          fname: person.fname,
          mname: person.mname,
          lname: person.lname,
          email: person.email,
          jobPosition: person.jobPosition,
          mobileNumber: person.mobileNumber,
          Remarks: person.Remarks,
        })),
      products: customerProducts
        .filter((product) => {
          // Ignore deleted
          if (product.isDeleted) return false;
          // For new items, ignore if required fields are empty
          if (
            product.type === "new" &&
            (!product.prod_id ||
              !product.customer_product_code ||
              !product.customer_product_name ||
              product.customer_prod_price === "" ||
              product.customer_prod_price === null ||
              product.customer_prod_price === undefined)
          ) {
            return false;
          }
          return true;
        })
        .map((product) => ({
          customer_prod_id: product.customer_prod_id,
          prod_id: product.prod_id,
          customer_product_code: product.customer_product_code,
          customer_product_name: product.customer_product_name,
          customer_prod_price: product.customer_prod_price,
          customer_prod_status: product.customer_prod_status,
        })),
    };

    // Prepare initial data for comparison
    const initialDataForComparison = {
      ...initialData,
      vatPercentage: initialData.vatPercentage || 0, // Add OR operator here too
      discountPercentage: initialData.discountPercentage || 0, // Add OR operator here too
      socialLinks: initialData.socialLinks.map((link) => ({
        id: link.id,
        platform: link.platform,
        link: link.link,
      })),
      contactPerson: initialData.contactPerson.map((person) => ({
        id: person.id,
        fname: person.fname,
        mname: person.mname,
        lname: person.lname,
        email: person.email,
        job_position: person.job_position,
        mobile_no: person.mobile_no,
        remarks: person.remarks,
      })),
      products: initialData.products.map((product) => ({
        customer_prod_id: product.customer_id,
        prod_id: product.prod_id,
        customer_product_code: product.customer_product_code,
        customer_product_name: product.customer_product_name,
        customer_prod_price: product.customer_prod_price,
        customer_prod_status: product.customer_prod_status,
      })),
    };

    // Deep comparison function
    const hasChanges = (initial, current) => {
      const stringifyReplacer = (key, value) => {
        if (key === "id") return undefined; // Ignore id fields in comparison
        return value;
      };

      return (
        JSON.stringify(initial, stringifyReplacer) !==
        JSON.stringify(current, stringifyReplacer)
      );
    };

    if (!hasChanges(initialDataForComparison, currentData)) {
      swal({
        title: "No Changes",
        text: "No changes were made to the customer data.",
        icon: "info",
      });
      return;
    }

    try {
      // Prepare data to send - ADD OR OPERATOR HERE
      const dataToUpdate = {
        status,
        companyName,
        companyNature,
        companyEmail,
        companyAddress,
        country,
        mobileNumber,
        telephoneNumber,
        tin,
        currencyID,
        paymentMethod,
        paymentTerms,
        otherPaymentTerms,
        vatPercentage: vatPercentage || 0, // Add OR operator here
        discountIDNo,
        discountPercentage: discountPercentage || 0, // Add OR operator here
        socialLinks: socialLinks.filter((link) => !link.isDeleted),
        contactPerson: contactPerson.filter((person) => !person.isDeleted),
        userLoggedID,
      };

      // Include all products (new and existing), but ignore empty new items
      const productsToUpdate = customerProducts.filter((product) => {
        if (product.isDeleted) return false;
        if (product.type === "new") {
          // Only skip if product is not selected at all
          if (!product.prod_id) return false;
          // Allow saving even if client code/name/price are empty
          return true;
        }
        return true;
      });

      if (productsToUpdate.length > 0) {
        dataToUpdate.products = productsToUpdate.map((product) => ({
          customer_prod_id: product.customer_prod_id,
          prod_id: product.prod_id,
          customer_product_code: product.customer_product_code,
          customer_product_name: product.customer_product_name,
          customer_prod_price: parsePrice(product.customer_prod_price),
          customer_prod_status: product.customer_prod_status,
          type: product.type, // 'new' or 'old'
        }));
      }

      const response = await axios.put(
        `${BASE_URL}/customer/updateCustomer/${id}`,
        dataToUpdate
      );

      if (response.status === 200) {
        swal({
          title: "Success!",
          text: "Customer updated successfully",
          icon: "success",
        }).then(() => navigate("/sales/customers"));
      }
    } catch (err) {
      console.error(err);
      swal({
        title: "Error!",
        text: "Failed to update customer",
        icon: "error",
      });
    }
  };

  // Fetch all products on mount
  useEffect(() => {
    axios
      .get(`${BASE_URL}/product/getProductData`)
      .then((res) => setAvailableProducts(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Helper to get already selected product IDs
  const selectedProductIds = customerProducts
    .filter((p) => !p.isDeleted)
    .map((p) => p.prod_id);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3">
            <Link to="/sales/customers" className="text-dark mx-2">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            CUSTOMER DETAILS
          </span>
        </div>
      </div>

      <Form noValidate validated={validated} onSubmit={updateCustomer}>
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
          id={id}
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
          telephoneNumber={telephoneNumber}
          setTelephoneNumber={setTelephoneNumber}
          products={customerProducts}
          setProducts={setCustomerProducts}
          roleType={roleType}
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
          discountIDNo={discountIDNo}
          setDiscountIDNo={setDiscountIDNo}
          discountPercentage={discountPercentage}
          setDiscountPercentage={setDiscountPercentage}
        />

        {authrztn.includes("Customers-Edit") && (
          <div className="d-flex justify-content-end mt-3">
            <Button
              variant="outline-secondary"
              className="mx-2"
              onClick={() => navigate("/sales/customers")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        )}
      </Form>
    </div>
  );
}

export default CustomerUpdate;
