// backend/routes/Printer/printer.route.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const router = express.Router();
const upload = multer();

// -------------------- Helpers --------------------

// Get PrintAgent port-info.json path
function getPortInfoPath() {
  const programDataPath = path.join(
    process.env.ProgramData || "C:\\ProgramData",
    "PrintAgent",
    "port-info.json"
  );
  if (fs.existsSync(programDataPath)) return programDataPath;

  const userDir = process.env.USERPROFILE || process.env.HOME;
  return path.join(userDir, "PrintAgent", "port-info.json");
}

// Generate PDF from plain text
async function generatePDFBuffer(text = "Test print") {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 800, size: 12, font, color: rgb(0, 0, 0) });
  return Buffer.from(await pdfDoc.save());
}

// Generate PDF from JSON data (tables, multiple pages)
async function generatePDFBufferFromJSON(jsonData) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let y = 800;

  // Title
  if (jsonData.title) {
    page.drawText(jsonData.title, {
      x: 50,
      y,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 30;
  }

  // Rows (tables)
  if (Array.isArray(jsonData.rows)) {
    for (const row of jsonData.rows) {
      const rowText = Array.isArray(row) ? row.join(" | ") : String(row);
      page.drawText(rowText, { x: 50, y, size: 12, font, color: rgb(0, 0, 0) });
      y -= 20;
      if (y < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = 800;
      }
    }
  }

  // Footer
  if (jsonData.footer) {
    page.drawText(jsonData.footer, {
      x: 50,
      y: 30,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
  }

  return Buffer.from(await pdfDoc.save());
}

// -------------------- Routes --------------------

/**
 * 🖨️ Test Print Route
 * Accepts:
 * 1. PDF file upload (req.file)
 * 2. Plain text (req.body.text)
 * 3. JSON structured document (req.body.jsonData)
 */
router.post("/testPrint", upload.single("file"), async (req, res) => {
  try {
    const { printer, text, jsonData } = req.body;

    if (!printer)
      return res
        .status(400)
        .json({ success: false, message: "Printer not specified" });

    let pdfBuffer;

    // Handle uploaded PDF
    if (req.file) {
      pdfBuffer = req.file.buffer;
    }
    // Handle plain text
    else if (text) {
      pdfBuffer = await generatePDFBuffer(text);
    }
    // Handle structured JSON
    else if (jsonData) {
      let parsed;
      try {
        parsed = JSON.parse(jsonData);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON data",
          error: err.message,
        });
      }
      pdfBuffer = await generatePDFBufferFromJSON(parsed);
    } else {
      return res
        .status(400)
        .json({ success: false, message: "No PDF, text, or JSON provided" });
    }

    // Read Print Agent info
    const portInfoPath = getPortInfoPath();
    if (!fs.existsSync(portInfoPath))
      return res
        .status(404)
        .json({ success: false, message: "Print Agent not detected" });

    const rawData = fs.readFileSync(portInfoPath, "utf-8");
    const portInfo = JSON.parse(rawData);
    const port = portInfo.port;
    const host = portInfo.host || portInfo.ip || "localhost";

    if (!port)
      return res
        .status(400)
        .json({ success: false, message: "Invalid Print Agent configuration" });

    // Send PDF to Print Agent
    const formData = new FormData();
    formData.append("file", pdfBuffer, { filename: "print.pdf" });
    formData.append("printer", printer);

    const agentResponse = await axios.post(
      `http://${host}:${port}/print`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 10000,
      }
    );

    return res.json({
      success: true,
      message: "Print job sent",
      agentResponse: agentResponse.data,
    });
  } catch (error) {
    console.error("❌ /testPrint error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send print",
      error: error.message,
    });
  }
});

// Add this to your printer.route.js
router.post("/printPdfBase64", upload.none(), async (req, res) => {
  try {
    const { printer, pdfBase64, filename } = req.body;

    if (!printer || !pdfBase64) {
      return res.status(400).json({
        success: false,
        message: "Printer and PDF data are required",
      });
    }

    // Read Print Agent info
    const portInfoPath = getPortInfoPath();
    if (!fs.existsSync(portInfoPath)) {
      return res.status(404).json({
        success: false,
        message: "Print Agent not detected",
      });
    }

    const rawData = fs.readFileSync(portInfoPath, "utf-8");
    const portInfo = JSON.parse(rawData);
    const port = portInfo.port;
    const host = portInfo.host || portInfo.ip || "localhost";

    if (!port) {
      return res.status(400).json({
        success: false,
        message: "Invalid Print Agent configuration",
      });
    }

    // Convert base64 back to buffer
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Create a temporary file for the PDF
    const tempDir = path.join(process.env.TEMP || os.tmpdir(), "print-agent");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPdfPath = path.join(
      tempDir,
      filename || `print-${Date.now()}.pdf`
    );
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    try {
      // Send PDF to Print Agent
      const formData = new FormData();
      formData.append("file", pdfBuffer, {
        filename: filename || "print.pdf",
      });
      formData.append("printer", printer);

      const agentResponse = await axios.post(
        `http://${host}:${port}/print`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 10000, // Shorter timeout for local network
        }
      );

      // Clean up temp file
      try {
        fs.unlinkSync(tempPdfPath);
      } catch (cleanupError) {
        console.log(
          "Warning: Could not clean up temp file:",
          cleanupError.message
        );
      }

      return res.json({
        success: true,
        message: "Print job sent via alternative method",
        agentResponse: agentResponse.data,
      });
    } catch (agentError) {
      // Clean up temp file on error
      try {
        fs.unlinkSync(tempPdfPath);
      } catch (cleanupError) {}

      throw agentError;
    }
  } catch (error) {
    console.error("❌ /printPdfBase64 error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send print via alternative method",
      error: error.message,
    });
  }
});

module.exports = router;
