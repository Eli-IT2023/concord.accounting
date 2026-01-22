// frontend/src/assets/services/printAgentService.js
import { detectPrintAgentURL } from "../global/printAgent";

export async function getPrinters() {
  const baseURL = await detectPrintAgentURL();
  if (!baseURL || baseURL === "browserBlocked")
    throw new Error("Print Agent not reachable");

  const res = await fetch(`${baseURL}/printers`);
  if (!res.ok) throw new Error("Failed to fetch printers");
  return res.json();
}

export async function sendPrintJob(printerName, pdfFile) {
  const baseURL = await detectPrintAgentURL();
  if (!baseURL || baseURL === "browserBlocked")
    throw new Error("Print Agent not reachable");

  const formData = new FormData();
  formData.append("file", pdfFile);
  formData.append("printer", printerName);

  const res = await fetch(`${baseURL}/print`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Print job failed");
  return res.json();
}
