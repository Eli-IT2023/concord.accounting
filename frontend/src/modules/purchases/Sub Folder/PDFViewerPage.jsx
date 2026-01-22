import React from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import PayablePDF2 from "./PayablePDF2";
import { useLocation } from "react-router-dom";

const PDFViewerPage = () => {
  // Get the ID from URL query parameters
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
      {/* <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px",
        }}
      >
        <h2>Payment Overview</h2>
        <PDFDownloadLink
          document={<PayablePDF id={id} />}
          fileName={`Payable-${id}.pdf`}
          style={{
            textDecoration: "none",
            padding: "10px 20px",
            color: "white",
            backgroundColor: "#dc3545",
            borderRadius: "4px",
          }}
        >
          {({ loading }) =>
            loading ? "Preparing download..." : "Download PDF"
          }
        </PDFDownloadLink>
      </div> */}

      <PDFViewer style={{ width: "100%", height: "100%" }}>
        <PayablePDF2 id={id} />
      </PDFViewer>
    </div>
  );
};

export default PDFViewerPage;
