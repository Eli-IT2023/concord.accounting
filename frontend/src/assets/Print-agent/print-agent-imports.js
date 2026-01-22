// 🔹 PDF generation
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// for printers
import PrintAgentRequiredModal from "../../assets/helpers/PrintAgentRequiredModal";
import {
  fetchLocalPrinters,
  sendPrintJob,
  sendPrintJobToBackend,
  checkPrintAgentHealth,
} from "../../assets/helpers/printHelper";
