// frontend/src/hooks/usePrintAgentCheck.js
import { detectPrintAgentURL } from "../global/printAgent";

/**
 * Check if Print Agent is available by calling its /printers endpoint.
 * Automatically retries with exponential backoff.
 */
export async function checkPrintAgentStatus(retries = 3, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const baseURL = await detectPrintAgentURL();
      if (baseURL && baseURL !== "browserBlocked") {
        const res = await fetch(`${baseURL}/printers`);
        if (res.ok) {
          console.log("✅ Print Agent online:", baseURL);
          return true;
        }
      }
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed:`, err.message);
    }

    // Exponential backoff before retrying
    await new Promise((r) => setTimeout(r, delay * (i + 1)));
  }

  console.log("❌ Print Agent not detected after retries.");
  return false;
}
