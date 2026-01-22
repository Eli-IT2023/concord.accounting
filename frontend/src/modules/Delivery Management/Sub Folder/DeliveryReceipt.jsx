import { React, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import swal from "sweetalert";
import { Modal, Button } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PaginationControls } from "../../../hooks/customHook/paginationHook/usePagination"; // Import our custom hook and component
import { useServerPagination } from "../../../hooks/customHook/paginationHook/useServerPagination"; // Import our custom hook and component

import BASE_URL from "../../../assets/global/url";
import useDecodeToken from "../../../hooks/customHook/useDecodeToken";

import "../../../assets/css/lionchem.css";

import Logo from "../../../assets/img/logo.jpg";

const DeliveryReceipt = ({ poData, prData, onGeneratePDF }) => {
  const poId = poData?.id || "N/A";
  const prId = prData?.id || "N/A";

  const [settings, setSettings] = useState(null);
  const [vendorPO, setVendorPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendorProduct, setVendorProduct] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ✅ Hook must always run, even if poData is null
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/CompanyProfile/fetchData`
        );
        if (response.data.success) {
          setSettings(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (poId && poId !== "N/A") {
      fetchVendorPO(poId);
      fetchVendorProduct(poId);
    }
  }, [poId]);

  const fetchVendorPO = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/PurchaseOrder/getVendorPO/${id}`
      );
      if (response.data && response.data.length > 0) {
        setVendorPO(response.data[0]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch purchase order details vendor", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorProduct = async (id) => {
    try {
      setLoadingProducts(true);
      const response = await axios.get(
        `${BASE_URL}/PurchaseOrder/getVendorProduct/${id}`
      );
      setVendorProduct(response.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      swal("Error", "Failed to fetch vendor products", "error");
      setVendorProduct([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // ✅ Now safe to check render conditions
  if (loading) return <div>Loading purchase order details...</div>;
  if (!vendorPO) return <div>No purchase order data found</div>;

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <div
      className="container-fluid bg-white p-3 rounded"
      id="pdfVendorCanvassPage"
    >
      {/* <span>PO ID: {poId}</span> */}
      {/* Header Section */}
      {/* <div style={{ width: "40%", position: "relative" }}>
        <div style={{ position: "absolute", marginLeft: "20px" }}>
          <img
            src={settings?.logo || Logo}
            className="img-fluid"
            alt="Logo"
            style={{ minWidth: "120px", maxHeight: "120px" }}
          />
        </div>
      </div> */}
      <div className="w-100 d-flex flex-column align-items-center justify-content-center">
        <div style={{ width: "65%" }}>
          {/* Logo positioned absolutely on the left */}
          <div style={{ position: "absolute", left: 90, top: 35 }}>
            <img
              src={settings?.logo || Logo}
              className="img-fluid"
              alt="Logo"
              style={{ minWidth: "100px", maxHeight: "100px" }}
            />
          </div>
          {/* Centered text content */}
          <div className="text-center">
            <h5 className="mb-1" style={{ fontWeight: 700 }}>
              {settings?.company_name.toUpperCase() ||
                "Concord Scientific & Chemical Corporation".toUpperCase()}
            </h5>
            <span>
              {settings?.company_address ||
                "2nd Floor Unit B ARCA Corporate Center, 150 F. Dela Cruz Street Cor. Maysan Road, Brgy Maysan, Valenzuela, Philippines"}
            </span>
            <br />
            <span>VAT Reg. TIN: {settings?.tin || "N/A"}</span>
            <br />
            <span>Telephone No: {settings?.landline || "(02)  8659 8685"}</span>
          </div>
        </div>

        <div style={{ width: "65%" }}>
          <h5 className="mt-4 fw-bold text-center fs-3">DELIVERY RECEIPT</h5>
        </div>
      </div>

      {/* KALIWA */}
      <div className="w-100 d-flex flex-row justify-content-between mb-3">
        <div className="d-flex flex-column">
          <span>
            <strong>DELIVERED TO:</strong>
          </span>
          <span>
            <strong>Address:</strong>
          </span>
          <span>
            <strong>TIN:</strong>
          </span>
          <span>
            <strong>Business Style:</strong>
          </span>
        </div>
        {/* KANAN  */}
        <div className="d-flex flex-column" style={{ minWidth: "25%" }}>
          <span>
            <strong>Date:</strong>
          </span>
          <span>
            <strong>Your P.O. No.:</strong>
          </span>
          <span className="mt-4">
            <strong>Terms:</strong>
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="mt-4">
        <table className="table" id="pdfProductTable">
          <thead>
            <tr>
              <th
                className="text-center py-1 border border-start-0 border-black"
                style={{
                  color: "#00000",
                  width: "15%",
                }}
              >
                QTY / UNIT
              </th>
              <th
                className="text-center py-1"
                style={{
                  color: "#00000",
                  width: "85%",
                  borderTop: "1px solid black",
                }}
              >
                ARTICLES AND DESCRIPTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {loadingProducts ? (
              <tr>
                <td colSpan="4" className="text-center">
                  Loading products...
                </td>
              </tr>
            ) : vendorProduct.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">
                  No products found
                </td>
              </tr>
            ) : (
              vendorProduct.map((product, index) => (
                <tr key={index}>
                  <td className="text-center border border-top-0 border-bottom-0 border-start-0 border-black p-0 py-1">
                    {parseFloat(product.quantity).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="text-center border-bottom-0 p-0 py-1">
                    ₱{" "}
                    {parseFloat(
                      product.quantity * product.price || 0
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan="2"
                className="fw-bold text-center py-1 border border-start-0 border-end-0 border-black"
              >
                Please make all checks payable to{" "}
                {settings?.company_name.toUpperCase() ||
                  "Concord Scientific & Chemical Corporation".toUpperCase()}
              </td>
            </tr>
            <tr>
              <td
                colSpan="2"
                style={{
                  textAlign: "justify",
                }}
                className="py-2 fw-bold border border-start-0 border-end-0 border-black"
              >
                IMPORTANT: GOODS TRAVEL & BUYER'S RISK. It is understood that
                goods described herein remain the Property of{" "}
                {settings?.company_name ||
                  "Concord Scientific & Chemical Corporation"}
                . until paid in full. Overdue accounts shall bear the 12%
                interest per annum. In case of court suit, BUYER shall pay an
                amount equivalent to 25% of the value of goods in litigation for
                attorney's fee aside from court cost. Parties here to expressly
                submit to the jurisdiction of the court of Quezon City in any
                legal action.
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* total section */}
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col fw-bold p-0">
            <span>Approved for Delivery</span>
          </div>
          <div className="col text-end fw-bold p-0">
            <span>Received above articles in good order and condition</span>
          </div>
        </div>
        <div className="row mt-4">
          <div className="col fw-bold p-0">
            <span>
              {settings?.company_name ||
                "Concord Scientific & Chemical Corporation".toUpperCase()}
            </span>
          </div>
          <div className="col fw-bold p-0">
            <div
              style={{ minWidth: "250px" }}
              className="d-flex flex-column justify-content-between mt-3 gap-4"
            >
              <p> By: </p>
              <div>
                <div
                  style={{
                    borderBottom: "1px solid black",
                    width: "100%",
                    margin: "0 auto",
                    paddingBottom: "0.5rem",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Signature Section */}
      <div
        className="w-100 d-flex justify-content-center align-items-center"
        style={{ minHeight: "275px" }}
      >
        <span>
          <strong>
            <i>*THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAXES*</i>
          </strong>
        </span>
      </div>
    </div>
  );
};

export default DeliveryReceipt;
