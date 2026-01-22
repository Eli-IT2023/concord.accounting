// frontend/src/modules/Settings/PrintersPage.js
import React, { useEffect, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sendPrintJob, checkPrintAgentHealth } from "../../helpers/printHelper";
import { getPrinters } from "../../assets/services/printAgentService";

function PrintersPage() {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPrinters() {
      try {
        const list = await getPrinters();
        console.log("Fetched printers:", list);
        setPrinters(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load printers:", err);
        setError(err.message);
        setPrinters([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPrinters();
  }, []);

  const generateTestPDF = async (printerName) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText("LIONCHEM PRINTERS PAGE TEST", {
      x: 50,
      y: 800,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Printer: ${printerName}`, {
      x: 50,
      y: 760,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Date: ${new Date().toLocaleString()}`, {
      x: 50,
      y: 740,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText("This test confirms the Print Agent is working!", {
      x: 50,
      y: 700,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    return new File(
      [new Blob([pdfBytes], { type: "application/pdf" })],
      `printers-page-test.pdf`,
      { type: "application/pdf" }
    );
  };

  const handleTestPrint = async (printer) => {
    try {
      // Check if print agent is healthy
      const isHealthy = await checkPrintAgentHealth();
      if (!isHealthy) {
        alert("Print Agent is not responding. Please ensure it's running.");
        return;
      }

      const pdfFile = await generateTestPDF(printer.name);
      await sendPrintJob(printer, pdfFile);
      alert(`Print sent to ${printer.name}`);
    } catch (err) {
      alert("Print failed: " + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading printers...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Error Loading Printers</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Available Printers ({printers.length})</h2>
      {printers.length === 0 ? (
        <p>No printers found. Make sure Print Agent is running.</p>
      ) : (
        <ul>
          {printers.map((p, i) => (
            <li key={i} style={{ marginBottom: "10px" }}>
              <strong>{p.name}</strong> ({p.status}) - {p.driver}
              <button
                onClick={() => handleTestPrint(p)}
                style={{ marginLeft: "10px" }}
              >
                Test Print
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PrintersPage;
