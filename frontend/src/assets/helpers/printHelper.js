// frontend/src/helpers/printHelper.js
import axios from "axios";
import {
  detectPrintAgentURL,
  fetchClientPrinters,
  checkPrintAgentHealth as checkAgentHealth,
  sendPrintJob as sendPrintJobToAgent,
} from "../global/printAgent";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import swal from "sweetalert";
import BASE_URL from "../../assets/global/url";

/**
 * Fetch local printers - Merged version with client-side discovery and fallback
 */
export async function fetchLocalPrinters(retries = 3, interval = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const agentURL = await detectPrintAgentURL();

    if (agentURL === "browserBlocked") {
      return {
        printers: [],
        agentInstalled: false,
        modalType: "browserBlocked",
      };
    }
    if (!agentURL) {
      if (attempt === retries)
        return {
          printers: [],
          agentInstalled: false,
          modalType: "notInstalled",
        };
      await new Promise((resolve) => setTimeout(resolve, interval));
      continue;
    }

    try {
      // Try client-side printer discovery first (new method)
      console.log("🖨️ Trying client-side printer discovery...");
      const clientPrinterResult = await fetchClientPrinters(agentURL);

      if (
        clientPrinterResult.success &&
        clientPrinterResult.printers.length > 0
      ) {
        console.log(
          `✅ Found ${clientPrinterResult.printers.length} client printers`
        );

        // Filter out virtual printers and show only real ones
        const realPrinters = clientPrinterResult.printers.filter(
          (p) =>
            p.status === "Online" &&
            ![
              "OneNote (Desktop)",
              "Microsoft XPS Document Writer",
              "Microsoft Print to PDF",
              "Fax",
            ].includes(p.name)
        );

        return {
          printers: realPrinters,
          agentInstalled: true,
          modalType: "installed",
        };
      }

      // Fallback to old server printers method
      console.log(
        "🔄 Client printers not found, falling back to server printers..."
      );
      const res = await axios.get(`${agentURL}/printers`, { timeout: 2000 });
      let printers = res.data || [];

      // Handle both old array format and new object format
      if (Array.isArray(printers)) {
        // Old format - direct array of printers
        printers = printers.filter(
          (p) =>
            p.status === "Online" &&
            ![
              "OneNote (Desktop)",
              "Microsoft XPS Document Writer",
              "Microsoft Print to PDF",
              "Fax",
            ].includes(p.name)
        );
      } else if (printers.serverPrinters) {
        // New format - object with serverPrinters array
        printers = printers.serverPrinters.filter(
          (p) =>
            p.status === "Online" &&
            ![
              "OneNote (Desktop)",
              "Microsoft XPS Document Writer",
              "Microsoft Print to PDF",
              "Fax",
            ].includes(p.name)
        );
      } else {
        printers = [];
      }

      return {
        printers: Array.isArray(printers) ? printers : [],
        agentInstalled: true,
        modalType: "installed",
      };
    } catch (error) {
      console.error("Error fetching printers:", error);
      if (attempt === retries) {
        return { printers: [], agentInstalled: true, modalType: "installed" };
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
  return { printers: [], agentInstalled: false, modalType: "notInstalled" };
}

// Convert text to PDF in frontend (from old code)
async function generatePDFFile(text = "Test print") {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 800, size: 12, font, color: rgb(0, 0, 0) });
  const pdfBytes = await pdfDoc.save();
  return new File(
    [new Blob([pdfBytes], { type: "application/pdf" })],
    "print.pdf",
    {
      type: "application/pdf",
    }
  );
}

/**
 * sendPrintJob - Enhanced version with better error handling:
 * - Accepts either a File (PDF) or a text string (will generate a PDF)
 * - Detects the Print Agent URL and posts multipart/form-data with 'file' and 'printer'
 */
export async function sendPrintJob(printer, pdfFile, userLoggedID = null) {
  try {
    console.log("🖨️ Starting print job...");
    const agentURL = await detectPrintAgentURL();
    console.log("🔍 Detected Print Agent URL:", agentURL);

    if (!agentURL || agentURL === "browserBlocked") {
      throw new Error("Print Agent not found or blocked by browser.");
    }

    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("printer", printer?.name || printer);
    if (userLoggedID) formData.append("userLoggedID", userLoggedID);

    console.log("📤 Sending print job to:", `${agentURL}/print`);
    console.log("🧾 FormData content:", {
      printer: printer?.name || printer,
      fileName: pdfFile?.name,
      size: pdfFile?.size,
    });

    const res = await axios.post(`${agentURL}/print`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });

    console.log("✅ Print Agent raw response:", res.data);

    if (res.data?.success) {
      swal({
        icon: "success",
        title: "Print Sent!",
        text: "Your PDF has been sent to the printer.",
        timer: 3000,
      });
      return res.data;
    } else {
      console.error("⚠️ Print Agent responded but failed:", res.data);
      throw new Error(
        res.data?.error || "Print Agent failed to process print job."
      );
    }
  } catch (error) {
    console.error("❌ sendPrintJob error:", error);
    let message = error.message;

    if (error.response) {
      console.error("🔴 Axios response error:", error.response.data);
      message = error.response.data?.error || message;
    } else if (error.request) {
      console.error("🟠 Axios request error (no response):", error.request);
      message = "No response from Print Agent. Check if it's running.";
    }

    swal({
      icon: "error",
      title: "Print Failed",
      text: message,
    });

    throw error;
  }
}

/**
 * sendPrintJobToBackend - Keep your original backend flow:
 * This function stays for the server-to-agent flow.
 * It posts to your backend (BASE_URL) testPrint route so the backend can
 * generate PDFs and forward them to the Print Agent.
 */
export async function sendPrintJobToBackend(printer, options = {}) {
  try {
    const { text, pdfFile, jsonData } = options;

    if (!printer) {
      swal({
        icon: "error",
        title: "Printer Not Specified",
        text: "Please select a printer.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("printer", printer);

    if (pdfFile) {
      formData.append("file", pdfFile);
    } else if (text) {
      formData.append("text", text);
    } else if (jsonData) {
      formData.append("jsonData", JSON.stringify(jsonData));
    } else {
      // Default test content
      formData.append(
        "text",
        `Test Print from LionChem Web App\nPrinter: ${printer}\nDate: ${new Date().toLocaleString()}`
      );
    }

    console.log("📤 Sending to backend print route...");

    const res = await axios.post(`${BASE_URL}/Printer/testPrint`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000, // 30 seconds timeout
    });

    console.log("✅ Backend print response:", res.data);

    if (res.data.success) {
      swal({
        icon: "success",
        title: "Print Sent!",
        text: res.data.message || "Your document has been sent to the printer.",
        timer: 3000,
      });
    } else {
      throw new Error(res.data.message || "Print job failed");
    }
  } catch (error) {
    console.error("❌ sendPrintJobToBackend error:", error);

    let errorMessage = error.message;

    // Provide more specific error messages
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.code === "ECONNABORTED") {
      errorMessage =
        "Print request timed out. Please check if Print Agent is running.";
    } else if (error.response?.status === 404) {
      errorMessage =
        "Print Agent not found. Please ensure it's installed and running.";
    }

    swal({
      icon: "error",
      title: "Print Error",
      text: errorMessage,
    });
    throw error;
  }
}

/**
 * Test a specific client printer
 */
export async function testClientPrinter(printerName) {
  try {
    const agentURL = await detectPrintAgentURL();
    if (!agentURL) {
      throw new Error("Print Agent not found");
    }

    const response = await axios.post(
      `${agentURL}/test-client-printer`,
      {
        printerName: printerName,
      },
      {
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error testing printer:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Health check function for Print Agent - Enhanced version
 */
export async function checkPrintAgentHealth() {
  try {
    const agentURL = await detectPrintAgentURL();
    if (!agentURL || agentURL === "browserBlocked") {
      return {
        success: false,
        status: agentURL === "browserBlocked" ? "browser_blocked" : "not_found",
      };
    }

    // Use the imported health check function
    const health = await checkAgentHealth(agentURL);
    return health;
  } catch (error) {
    console.error("Print Agent health check failed:", error);
    return {
      success: false,
      error: error.message,
      status: "error",
    };
  }
}

/**
 * Get detailed printer information
 */
export async function getPrinterStatus(printerName) {
  try {
    const agentURL = await detectPrintAgentURL();
    if (!agentURL) {
      throw new Error("Print Agent not found");
    }

    const response = await axios.get(
      `${agentURL}/printer-status/${encodeURIComponent(printerName)}`,
      {
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error getting printer status:", error.message);
    return { error: error.message };
  }
}

/**
 * Get print queue status
 */
export async function getPrintQueue() {
  try {
    const agentURL = await detectPrintAgentURL();
    if (!agentURL) {
      throw new Error("Print Agent not found");
    }

    const response = await axios.get(`${agentURL}/print-queue`, {
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error getting print queue:", error.message);
    return { error: error.message };
  }
}
