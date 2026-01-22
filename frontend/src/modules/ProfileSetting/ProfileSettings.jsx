import React, { useState, useEffect, useRef } from "react";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import swal from "sweetalert";
import imageCompression from "browser-image-compression";

function ProfileSettings() {
  const [editMode, setEditMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="d-flex flex-row gap-4 ">
        {/* profilepicture and nav to change pass */}
        <div className="bg-white w-50 p-5 rounded-3 d-flex flex-column align-items-center">
          <div className="d-flex flex-column align-items-center gap-3 mb-4">
            <div
              className="profile-img-container"
              onClick={() => setShowModal(true)}
              style={{ cursor: "pointer" }}
            >
              <img
                src="https://www.w3schools.com/howto/img_avatar.png"
                alt="Avatar"
                className="rounded-circle"
                style={{ width: "200px", cursor: "pointer" }}
              />
              <span className="view-label">View</span>
            </div>
            <div className="mt-2 d-flex flex-column fs-5 fw-bold text-center">
              <span>name</span>
              <span>role</span>
            </div>
          </div>

          <div>
            <div className="mt-3">
              <button className="btn btn-primary w-100" disabled>
                Profile Settings
              </button>
            </div>
            <div className="mt-4">
              <button className="btn btn-outline-primary w-100" disabled>
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* form to change profile details */}
        <div className="bg-white w-100 p-5 rounded-3">
          <div className="mb-4">
            <span className="fw-bold fs-4">Profile Settings</span>
          </div>
          <div>
            <Form>
              <div className="row">
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="fname"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="lname"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="number"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>Province</Form.Label>
                    <Form.Control
                      type="text"
                      name="province"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>Zip Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="zip_code"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>Birthdate</Form.Label>
                    <Form.Control
                      type="date"
                      name="birthdate"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Control
                      type="text"
                      name="gender"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Control type="text" name="status" readOnly />
                  </Form.Group>
                </div>
                <div className="col">
                  <Form.Group className="mb-3">
                    <Form.Label>User Type</Form.Label>
                    <Form.Control
                      type="text"
                      name="user_type"
                      readOnly={!editMode}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="mb-3">
                <Form.Group>
                  <Form.Label>Profile Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    disabled={!editMode}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedImage(
                          URL.createObjectURL(e.target.files[0])
                        );
                      }
                    }}
                  />
                </Form.Group>
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="mt-2 rounded-2"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>

              <div className="d-flex justify-content-end mt-5">
                {!editMode ? (
                  <button
                    type="button"
                    className="btn btn-outline-primary px-4"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn-primary px-4">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 ms-3"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </button>
                  </>
                )}
                <Modal
                  show={showModal}
                  onHide={() => setShowModal(false)}
                  centered
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Image Preview</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="d-flex justify-content-center align-items-center">
                    <img
                      src={
                        selectedImage ||
                        "https://www.w3schools.com/howto/img_avatar.png"
                      }
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxWidth: "400px",
                        borderRadius: "10px",
                      }}
                    />
                  </Modal.Body>
                  <Modal.Footer>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                  </Modal.Footer>
                </Modal>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfileSettings;
