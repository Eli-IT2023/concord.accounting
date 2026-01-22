import React, { useState, useEffect, useRef } from "react";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import swal from "sweetalert";
import imageCompression from "browser-image-compression";

function CompanySettings() {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sub_name: "",
    address: "",
    phone: "",
    email: "",
    profile_picture: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [companyId, setCompanyId] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const fileInputRef = useRef();

  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  // Fetch company settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await axios.get(`${BASE_URL}/company_profile/get`);
        if (res.data && res.data.company) {
          setForm({
            name: res.data.company.name || "",
            sub_name: res.data.company.sub_name || "",
            address: res.data.company.address || "",
            phone: res.data.company.phone || "",
            email: res.data.company.email || "",
            profile_picture: null,
          });
          setCompanyId(res.data.company.id);
          if (res.data.company.profile_picture) {
            setImagePreview(
              `data:image/jpeg;base64,${res.data.company.profile_picture}`
            );
          }
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchSettings();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: MAX_IMAGE_SIZE_MB,
          maxWidthOrHeight: 600,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        if (compressedFile.size > MAX_IMAGE_SIZE_BYTES) {
          swal(
            "File Too Large",
            `The file "${file.name}" exceeds the ${MAX_IMAGE_SIZE_MB} MB limit even after compression.`,
            "error"
          );
          return;
        }
        setForm((prev) => ({ ...prev, profile_picture: compressedFile }));
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (err) {
        swal(
          "Compression Error",
          `Failed to compress "${file.name}".`,
          "error"
        );
      }
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      let res;
      if (companyId) {
        res = await axios.put(
          `${BASE_URL}/company_profile/update/${companyId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        res = await axios.post(`${BASE_URL}/company_profile/create`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      swal("Success", "Company settings saved!", "success");
      setEditMode(false);

      // Reload data to update preview and form
      const getRes = await axios.get(`${BASE_URL}/company_profile/get`);
      if (getRes.data && getRes.data.company) {
        setForm({
          name: getRes.data.company.name || "",
          sub_name: getRes.data.company.sub_name || "",
          address: getRes.data.company.address || "",
          phone: getRes.data.company.phone || "",
          email: getRes.data.company.email || "",
          profile_picture: null,
        });
        setCompanyId(getRes.data.company.id);
        if (getRes.data.company.profile_picture) {
          setImagePreview(
            `data:image/jpeg;base64,${getRes.data.company.profile_picture}`
          );
        } else {
          setImagePreview("");
        }
      }
    } catch (err) {
      swal(
        "Error",
        err.response?.data?.error || "Error saving company settings",
        "error"
      );
    }
  };

  // Cancel edit
  const handleCancel = async () => {
    setEditMode(false);
    // Reload data to revert changes
    try {
      const res = await axios.get(`${BASE_URL}/company_profile/get`);
      if (res.data && res.data.company) {
        setForm({
          name: res.data.company.name || "",
          sub_name: res.data.company.sub_name || "",
          address: res.data.company.address || "",
          phone: res.data.company.phone || "",
          email: res.data.company.email || "",
          profile_picture: null,
        });
        setCompanyId(res.data.company.id);
        if (res.data.company.profile_picture) {
          setImagePreview(
            `data:image/jpeg;base64,${res.data.company.profile_picture}`
          );
        } else {
          setImagePreview("");
        }
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  return (
    <>
      <div className="border bg-white custom-container p-3">
        <div className="fw-bold fs-3 mb-3">
          <span>Settings</span>
        </div>

        <div className="d-flex flex-row align-items-center gap-4  mb-4">
          <span className="fw-bold fs-5" style={{ width: "20%" }}>
            Company Profile
          </span>
          <div
            style={{ borderBottom: "2px solid #acacacff", width: "100%" }}
          ></div>
        </div>

        <div className="row">
          <Form>
            <div className="row">
              <div className="col-6">
                <div className="col ">
                  <Form.Group>
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter Company Name"
                      disabled={!editMode}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Sub-Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="sub_name"
                      value={form.sub_name}
                      onChange={handleChange}
                      placeholder="Enter Sub-Name"
                      disabled={!editMode}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Enter Address"
                      disabled={!editMode}
                    />
                  </Form.Group>
                </div>

                <div className="fw-bold fs-5 my-4">
                  <span>Contact Information</span>
                  <span></span>
                </div>

                <div className="row">
                  <Form.Group>
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter Phone Number"
                      disabled={!editMode}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter Email"
                      disabled={!editMode}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="d-flex flex-column justify-content-start align-items-center w-50">
                <div
                  className="profile-image-container"
                  onClick={() => imagePreview && setShowImageModal(true)}
                  title={imagePreview ? "View" : ""}
                >
                  <img
                    src={imagePreview || ""}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                  {imagePreview && (
                    <div className="profile-image-hover">View</div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    id="company-logo-upload"
                    style={{ display: "none" }}
                    disabled={!editMode}
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                  <label htmlFor="company-logo-upload" className="mt-3">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!editMode}
                      onClick={() =>
                        fileInputRef.current && fileInputRef.current.click()
                      }
                    >
                      Upload Image
                    </button>
                  </label>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end">
              {!editMode ? (
                <button
                  type="button"
                  className="btn btn-primary mt-4"
                  style={{ width: "130px" }}
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-success mt-4"
                    onClick={handleSave}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger mt-4 ms-2"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </Form>

          <Modal
            show={showImageModal}
            onHide={() => setShowImageModal(false)}
            centered
            size="md"
            backdropClassName="modal-blur-bg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Company Profile Image</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex justify-content-center align-items-center">
              <img
                src={imagePreview}
                alt="Company Profile"
                style={{
                  maxWidth: "100%",
                  maxHeight: "60vh",
                  borderRadius: "10px",
                }}
              />
            </Modal.Body>
          </Modal>
        </div>
      </div>
    </>
  );
}

export default CompanySettings;
