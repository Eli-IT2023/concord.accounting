// frontend/src/modules/Settings/CompanyProfile.jsx
import React, { useEffect, useState } from "react";
import { Form, Modal, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import { ThreeDot } from "react-loading-indicators";
import swal from "sweetalert";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";

// 🔹 PDF generation
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// for printers
import PrintAgentRequiredModal from "../../assets/helpers/PrintAgentRequiredModal";
import {
  fetchLocalPrinters,
  sendPrintJob,
  sendPrintJobToBackend, // Add this import
  checkPrintAgentHealth,
} from "../../assets/helpers/printHelper";

// for rbac
import NoAccess from "../../assets/img/NoAccess.png";

const CompanyProfile = ({ authrztn, roleType, rbacUserRole }) => {
  const userLoggedID = useDecodeToken();
  const [imagePreview, setImagePreview] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [landline, setLandline] = useState("");
  const [email, setEmail] = useState("");
  const [tin, setTin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForCreate, setIsForCreate] = useState(true);
  const [validated, setValidated] = useState(false);
  const [fetchData, setFetchData] = useState({});

  // --- Printers state ---
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [localPrinters, setLocalPrinters] = useState([]);
  const [isFetchingPrinters, setIsFetchingPrinters] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [showPrintAgentModal, setShowPrintAgentModal] = useState(false);
  const [modalType, setModalType] = useState("notInstalled");

  // --- Fetch company profile ---
  const fetchCompanyProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/CompanyProfile/fetchData`);
      if (res.data.success) setFetchData(res.data.data || {});
      else setFetchData({});
    } catch (error) {
      console.error("Error fetching company profile:", error);
      setFetchData({});
    }
  };

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  useEffect(() => {
    if (Object.keys(fetchData).length > 0) {
      const profile = fetchData;
      setCompanyName(profile?.company_name || "");
      setCompanyAddress(profile?.company_address || "");
      setContactNumber(profile?.contact_number || "");
      setLandline(profile?.landline || "");
      setEmail(profile?.email || "");
      setTin(profile?.tin || "");
      setImagePreview(profile?.logo || null);
      setIsForCreate(false);
    } else setIsForCreate(true);
  }, [fetchData]);

  // --- Save Company Profile ---
  const handleSave = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "No data",
        text: "Please fill out all the fields!",
      });
      return;
    }

    const confirmed = await swal({
      icon: "warning",
      title: "Create New Company Profile?",
      buttons: true,
      dangerMode: true,
    });
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/CompanyProfile/saveCompanyProfile`,
        {
          userLoggedID,
          companyName,
          companyAddress,
          contactNumber,
          landline,
          imagePreview,
          email,
          tin,
        },
      );

      if (res.status === 200) {
        await swal({
          icon: "success",
          title: "Success!",
          text: "Company Profile added!",
          button: false,
          timer: 2000,
        });
        fetchCompanyProfile();
      }
    } catch (error) {
      swal({
        icon: "error",
        title: "Error!",
        text: "There was an error saving company profile",
        button: false,
        timer: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Update Company Profile ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      swal({
        icon: "error",
        title: "No data",
        text: "Please fill out all the fields!",
      });
      return;
    }

    const confirmed = await swal({
      icon: "warning",
      title: "Update Company Profile?",
      buttons: true,
      dangerMode: true,
    });
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/CompanyProfile/updateCompanyProfile`,
        {
          userLoggedID,
          companyName,
          companyAddress,
          contactNumber,
          landline,
          imagePreview,
          email,
          tin,
        },
      );

      if (res.status === 200) {
        await swal({
          icon: "success",
          title: "Success!",
          text: "Company Profile updated!",
          button: false,
          timer: 2000,
        });
        fetchCompanyProfile();
      }
    } catch (error) {
      swal({
        icon: "error",
        title: "Error!",
        text: "There was an error updating company profile",
        button: false,
        timer: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- File change handler ---
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
        event.target.value = "";
        swal({
          icon: "error",
          title: "Invalid file format",
          text: "Please upload an image",
        });
      }
    } else setImagePreview(null);
  };

  // 🔹 Generate PDF for Test Print
  const generateTestPDF = async (printerName) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Title
    page.drawText("LIONCHEM TEST PRINT", {
      x: 50,
      y: 800,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Printer info
    page.drawText(`Printer: ${printerName}`, {
      x: 50,
      y: 760,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Timestamp
    page.drawText(`Date: ${new Date().toLocaleString()}`, {
      x: 50,
      y: 740,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Test content
    page.drawText("This is a test print from LionChem System", {
      x: 50,
      y: 700,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("Print Agent is working correctly", {
      x: 50,
      y: 670,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText("PDF generation is successful", {
      x: 50,
      y: 650,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    page.drawText("Direct printing to selected printer", {
      x: 50,
      y: 630,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    return new File(
      [new Blob([pdfBytes], { type: "application/pdf" })],
      `test-print-${printerName.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`,
      {
        type: "application/pdf",
      },
    );
  };

  const [isPrinting, setIsPrinting] = useState(false);

  // Update handleTestPrint to handle loading state
  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      swal({
        icon: "error",
        title: "No Printer Selected",
        text: "Please select a printer first.",
      });
      return;
    }

    setIsPrinting(true);

    try {
      console.log("=== TEST PRINT DEBUG ===");
      console.log("Selected Printer:", selectedPrinter);
      console.log("Print Agent Health:", await checkPrintAgentHealth());

      // Generate enhanced test PDF
      const pdfFile = await generateTestPDF(selectedPrinter.name);
      console.log("PDF File generated:", {
        name: pdfFile.name,
        size: pdfFile.size,
        type: pdfFile.type,
      });

      // Send directly to Print Agent
      console.log("Sending to Print Agent...");
      await sendPrintJob(selectedPrinter, pdfFile, userLoggedID);
      console.log("=== TEST PRINT COMPLETE ===");
    } catch (err) {
      console.error("=== TEST PRINT FAILED ===");
      console.error("Error:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  // --- Printer modal handler ---
  const handleOpenPrinterModal = async () => {
    setIsFetchingPrinters(true);
    setShowPrinterModal(false);
    setShowPrintAgentModal(false);

    try {
      const { printers, agentInstalled, modalType } =
        await fetchLocalPrinters();

      if (agentInstalled) {
        setLocalPrinters(printers || []);
        setShowPrinterModal(true);

        if (!printers || printers.length === 0) {
          swal({
            icon: "info",
            title: "No Printers Found",
            text: "The Print Agent is running but no printers were detected on this machine.",
          });
        }
      } else {
        setModalType(modalType);
        setShowPrintAgentModal(true);
      }
    } catch (err) {
      console.error("[CompanyProfile] Error fetching printers:", err);
      setModalType("notInstalled");
      setShowPrintAgentModal(true);
    } finally {
      setIsFetchingPrinters(false);
    }
  };

  // --- JSX ---
  return (
    <Form
      noValidate
      validated={validated}
      onSubmit={(e) => (isForCreate ? handleSave(e) : handleUpdate(e))}
      className="h-100 w-100 border bg-white custom-container"
    >
      {isLoading ? (
        <div className="loading-container">
          <ThreeDot
            variant="brick-stack"
            color="#6290FE"
            size="large"
            text="Loading Data..."
            textColor=""
          />
        </div>
      ) : authrztn.includes("CompanyProfile-View") ? (
        <>
          {/* --- Header Buttons --- */}
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3">COMPANY PROFILE</span>
              <span>PROFILE SETUP</span>
            </div>
            <div className="d-flex flex-row align-items-center">
              <button
                type="button"
                className="btn btn-secondary me-2 d-flex align-items-center"
                onClick={handleOpenPrinterModal}
                disabled={isFetchingPrinters}
              >
                {isFetchingPrinters ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Checking...
                  </>
                ) : (
                  "Select Printers"
                )}
              </button>

              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center title-button"
              >
                Save
              </button>
            </div>
          </div>

          {/* --- Main Form --- */}
          <div className="container-fluid">
            <div className="row mx-auto gap-3">
              {/* Left Column */}
              <div className="col-sm w-100 p-3">
                {/* Company Name */}
                <div className="my-3">
                  <p className="m-0">Company Name</p>
                  <input
                    className="w-100 form-control"
                    type="text"
                    placeholder="Enter Name"
                    title="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                {/* Company Address */}
                <div className="my-3">
                  <p className="m-0">Company Address</p>
                  <input
                    className="w-100 form-control"
                    type="text"
                    placeholder="Enter Address"
                    title="Company Address"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>
                {/* Contact Info */}
                <div className="mt-3 contact-section">
                  <div className="my-3">
                    <p className="m-0">Landline</p>
                    <input
                      className="w-100 form-control"
                      type="text"
                      placeholder="Enter Landline"
                      title="Landline"
                      value={landline}
                      onChange={(e) => setLandline(e.target.value)}
                    />
                  </div>
                  <div className="my-3">
                    <p className="m-0">Contact Number</p>
                    <input
                      className="w-100 form-control"
                      type="text"
                      placeholder="Enter Contact Number"
                      title="Enter Contact Number"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) e.preventDefault();
                      }}
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      maxLength={11}
                    />
                  </div>
                  <div className="my-3">
                    <p className="m-0">Company Email</p>
                    <input
                      className="w-100 form-control"
                      type="email"
                      placeholder="Enter Email"
                      title="Company E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="my-3">
                    <p className="m-0">TIN No.</p>
                    <input
                      className="w-100 form-control"
                      type="text"
                      placeholder="Enter TIN"
                      title="TIN No."
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Logo */}
              <div className="col-sm w-100 p-3 flex-column justify-content-center">
                <div className="d-flex flex-column align-items-center justify-content-center">
                  <div
                    className="mb-3 rounded-circle border"
                    style={{
                      width: "clamp(200px, 25vw, 220px)",
                      height: "clamp(150px, 20vw, 220px)",
                      border: "2px dashed #ddd",
                      overflow: "hidden",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    {imagePreview ? (
                      <img
                        className="d-flex h-100 w-100 align-items-center justify-content-center"
                        src={imagePreview}
                        alt="Company Logo Preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="d-flex flex-column h-100 w-100 align-items-center justify-content-center"
                        style={{
                          color: "#6c757d",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      >
                        <div>No image selected</div>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  className="w-100 px-3 py-2 border rounded"
                  type="file"
                  name="CompanyLogo"
                  id="companylogo"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                />
                <small>Please upload a JPG, PNG, or WEBP File</small>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}

      {/* --- Printer Modal --- */}
      <Modal
        show={showPrinterModal}
        onHide={() => setShowPrinterModal(false)}
        centered
        backdrop="static"
        keyboard={false}
        style={{ zIndex: 2000 }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Available Printers</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {isFetchingPrinters ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading printers...
            </div>
          ) : (
            (() => {
              const filteredPrinters = localPrinters.filter(
                (p) =>
                  p.status === "Online" &&
                  ![
                    "OneNote (Desktop)",
                    "Microsoft XPS Document Writer",
                    "Microsoft Print to PDF",
                    "Fax",
                  ].includes(p.name),
              );

              if (filteredPrinters.length === 0) {
                return (
                  <div className="text-center text-muted">
                    No online printers found on this machine.
                  </div>
                );
              }

              return (
                <div className="w-100 printer-list-container d-flex flex-column gap-2">
                  {filteredPrinters.map((p) => (
                    <div
                      key={p.id}
                      className={`printer-list p-2 border rounded d-flex align-items-center justify-content-between ${
                        selectedPrinter?.id === p.id
                          ? "bg-light border-primary"
                          : ""
                      }`}
                      onClick={() => setSelectedPrinter(p)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex flex-column">
                        <strong>{p.name}</strong>
                        <small className="text-success">{p.status}</small>
                      </div>
                      <Form.Check
                        type="radio"
                        name="selectedPrinter"
                        id={`printer-${p.id}`}
                        checked={selectedPrinter?.id === p.id}
                        onChange={() => setSelectedPrinter(p)}
                        className="me-2"
                      />
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPrinterModal(false)}
          >
            Close
          </Button>
          {selectedPrinter && (
            <Button
              variant="primary"
              onClick={handleTestPrint}
              disabled={isPrinting} // Change from isLoading to isPrinting
            >
              {isPrinting ? ( // Change from isLoading to isPrinting
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Printing...
                </>
              ) : (
                "Test Print"
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* --- Print Agent Modal --- */}
      <PrintAgentRequiredModal
        show={showPrintAgentModal}
        type={modalType}
        onCancel={() => setShowPrintAgentModal(false)}
        onDownload={() => {
          const link = document.createElement("a");
          link.href = "/application/print-agent-setup.zip";
          link.download = "print-agent-setup.zip";
          link.click();
          setShowPrintAgentModal(false);
        }}
      />
    </Form>
  );
};

export default CompanyProfile;
