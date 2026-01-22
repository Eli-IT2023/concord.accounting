// frontend/src/global/printAgent.js
import axios from "axios";

const DEFAULT_PORT_RANGE = { start: 9100, end: 9149 };
const TIMEOUT = 1500;

/**
 * Always return localhost to ensure detection stays on this machine,
 * not the LAN or webserver host (fix for multi-desktop setups)
 */
export function getDynamicHost() {
  return "127.0.0.1";
}

/**
 * Detects whether the browser is blocking local HTTP connections (Brave, etc.)
 */
export async function isBrowserBlocking() {
  const host = getDynamicHost();
  const testUrl = `http://${host}:9100/health`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    await fetch(testUrl, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // If we got any response, the browser is not blocking
    return false;
  } catch (err) {
    if (err.name === "AbortError") return false;
    if (err.message.includes("Failed to fetch")) return false;
    console.warn("🚫 Browser may be blocking local requests:", err.message);
    return true;
  }
}

/**
 * Try connecting to a specific port to see if Print Agent is alive
 */
async function tryDetect(host, port) {
  try {
    const res = await axios.get(`http://${host}:${port}/health`, {
      timeout: TIMEOUT,
    });
    if (res.status === 200 && res.data.status === "ok") {
      console.log(`✅ Found Print Agent on port ${port}`);
      return `http://${host}:${port}`;
    }
  } catch {}
  return null;
}

/**
 * Detects which port the local Print Agent is running on (9100–9149)
 * with progressive batches for faster detection.
 */
export async function detectPrintAgentURL(retryRounds = 2) {
  const host = getDynamicHost();
  console.log("🔍 Detecting Print Agent on this device:", host);

  const ports = Array.from(
    { length: DEFAULT_PORT_RANGE.end - DEFAULT_PORT_RANGE.start + 1 },
    (_, i) => DEFAULT_PORT_RANGE.start + i
  );

  // Detect in small batches for faster response
  for (let round = 0; round < retryRounds; round++) {
    const batch = ports.slice(round * 10, (round + 1) * 10);
    const attempts = batch.map((p) => tryDetect(host, p));
    try {
      const result = await Promise.any(attempts);
      if (result) {
        console.log("✅ Local Print Agent found at:", result);
        return result;
      }
    } catch {}
  }

  console.log("❌ No local Print Agent found in port range.");
  const blocked = await isBrowserBlocking();
  if (blocked) {
    console.log("🚫 Browser is blocking local connections (CORS/network).");
    return "browserBlocked";
  }
  return null;
}

/**
 * Get client-side printers from the Print Agent
 */
export async function fetchClientPrinters(baseURL) {
  if (!baseURL) {
    console.error("❌ Print Agent URL not found for fetching client printers");
    return { success: false, printers: [] };
  }

  try {
    console.log("🖨️ Fetching client printers from:", baseURL);
    const response = await axios.post(
      `${baseURL}/client-printers`,
      {},
      {
        timeout: 10000,
      }
    );

    if (response.data.success) {
      console.log(`✅ Found ${response.data.printers.length} client printers`);
      return {
        success: true,
        printers: response.data.printers,
        count: response.data.count,
      };
    } else {
      console.error("❌ Failed to fetch client printers:", response.data.error);
      return { success: false, printers: [], error: response.data.error };
    }
  } catch (error) {
    console.error("❌ Error fetching client printers:", error.message);
    return {
      success: false,
      printers: [],
      error: error.message,
    };
  }
}

/**
 * Test a specific client printer
 */
export async function testClientPrinter(baseURL, printerName) {
  if (!baseURL || !printerName) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    const response = await axios.post(
      `${baseURL}/test-client-printer`,
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
 * Check Print Agent health
 */
export async function checkPrintAgentHealth(baseURL) {
  if (!baseURL) {
    return { success: false, status: "no_url" };
  }

  try {
    const response = await axios.get(`${baseURL}/health`, {
      timeout: 5000,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sends a PDF file to the local Print Agent for printing
 * @param {File|Blob} file - The PDF file to print
 * @param {string} printer - Printer name (optional)
 * @param {string} baseURL - Base URL of the Print Agent (from detectPrintAgentURL)
 */
export async function sendPrintJob(file, printer, baseURL) {
  if (!baseURL) throw new Error("Print Agent URL not found.");

  const formData = new FormData();
  formData.append("file", file);
  if (printer) formData.append("printer", printer);

  try {
    const res = await axios.post(`${baseURL}/print`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 15000,
    });
    console.log("🖨️ Print response:", res.data);
    return { success: true, message: res.data };
  } catch (error) {
    console.error("❌ Print failed:", error.message);
    return { success: false, message: "Print failed." };
  }
}
