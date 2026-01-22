import React from "react";
import { Modal, Button } from "react-bootstrap";

/**
 * Props:
 * - show: boolean
 * - onCancel: function
 * - onDownload: function
 * - type: "notInstalled" | "browserBlocked"
 */
const PrintAgentRequiredModal = ({
  show,
  onCancel,
  onDownload,
  type = "notInstalled",
}) => {
  const isBrowserBlocked = type === "browserBlocked";

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {isBrowserBlocked
            ? "Browser Is Blocking the Print Agent"
            : "Print Agent Required"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {isBrowserBlocked ? (
          <>
            <p>
              Your browser is blocking access to the local Print Agent running
              on this computer.
            </p>

            <div className="mt-3 p-3 rounded bg-light text-muted">
              <strong>💡 How to fix this:</strong>
              <ol className="mt-2 mb-0">
                <li>
                  Allow <strong>local / private network access</strong> in your
                  browser.
                </li>
                <li>
                  Disable any <strong>ad blocker</strong> or browser shields for
                  this site.
                </li>
                <li>Refresh the page after changing the settings.</li>
              </ol>
            </div>

            <div className="mt-3 p-3 rounded bg-light text-muted">
              <strong>Browser tips:</strong>
              <ul className="mb-0 mt-2">
                <li>
                  <strong>Brave:</strong> Click the 🛡️ icon → Turn off Shields →
                  Allow local network access.
                </li>
                <li>
                  <strong>Chrome / Edge:</strong> Ensure the site is allowed to
                  access local network and no extensions are blocking requests.
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <p>
              The <strong>Print Agent</strong> is not installed or not currently
              running on this computer.
            </p>

            <p>
              You must install it before printing. Once installed, refresh this
              page and the system will detect it automatically.
            </p>

            <div className="mt-3 p-3 rounded bg-light text-muted">
              <strong>🛠 Installation steps:</strong>
              <ol className="mt-2 mb-0">
                <li>Download the Print Agent installer.</li>
                <li>
                  <strong>Extract</strong> the downloaded ZIP file to a folder.
                </li>
                <li>
                  Right-click the installer and select{" "}
                  <strong>Run as Administrator</strong>.
                </li>
                <li>Follow the setup wizard until installation completes.</li>
                <li>
                  Refresh the page
                  <em>(recommended)</em>.
                </li>
              </ol>
            </div>

            <div className="mt-3 p-3 rounded bg-light text-muted">
              <strong>⚠ Important:</strong>
              <ul className="mb-0 mt-2">
                <li>Administrator privileges are required.</li>
                <li>
                  Allow the Print Agent through firewall or security prompts.
                </li>
                <li>
                  Disable ad blockers if detection fails after installation.
                </li>
              </ul>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        {!isBrowserBlocked && (
          <Button variant="primary" onClick={onDownload}>
            Download Installer
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default PrintAgentRequiredModal;
