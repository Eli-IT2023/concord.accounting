import React from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF2 from "./InvoicePDF2";
import { useLocation } from "react-router-dom";

const InvoicePDFViewerPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 9999,
        background: "white",
      }}
    >
      <PDFViewer style={{ width: "100%", height: "100vh" }}>
        <InvoicePDF2 id={id} />
      </PDFViewer>
    </div>
  );
};

export default InvoicePDFViewerPage;
