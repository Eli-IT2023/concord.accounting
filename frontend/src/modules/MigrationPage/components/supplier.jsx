import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import { Button, Form } from "react-bootstrap";
import swal from "sweetalert";
import { isFileTemplateValid } from "../../../utils/validation";
const Supplier_Migration = ({ lastDate }) => {
  const [csvData, setCsvData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef();

  // const handleFileUpload = (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   Papa.parse(file, {
  //     header: true,
  //     skipEmptyLines: true,
  //     complete: function (results) {
  //       console.log("Parsed CSV data:", results.data);
  //       setCsvData(results.data);
  //     },
  //   });
  // };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const fileName = e.target.files[0].name;
    const fileType = e.target.files[0].type;

    // Validate file name and file type
    if (!fileName.endsWith(".csv") && fileType !== "text/csv") {
      swal({
        icon: "warning",
        title: "Unsupported File Type",
        text: "Please upload a valid CSV file only.",
      }).then(() => (fileRef.current.value = ""));

      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        // console.log("Parsed CSV data before skipping:", results.data);

        // Skip the first 2 rows
        const cleanedData = results.data.slice(2);

        if (!cleanedData.length) {
          swal({
            icon: "warning",
            title: "No data found in file",
            text: "Please make sure the file has rows after the header.",
          }).then(() => (fileRef.current.value = ""));

          return;
        }

        const requiredColumns = [
          "Supplier Name",
          "Payable Amount/s",
          "Asset Amount",
          "Liability Amount",
        ];

        if (!isFileTemplateValid(cleanedData, requiredColumns)) {
          swal({
            icon: "warning",
            title: "File Format Mismatch",
            text: "Your file doesn't match the expected template for Supplier Migration. Please download the sample file and try again.",
          }).then(() => (fileRef.current.value = ""));

          return;
        }

        // console.log("Parsed CSV data after skipping:", cleanedData);
        setCsvData(cleanedData);
      },
    });
  };

  const handleSendToServer = async () => {
    if (lastDate === "") {
      swal({
        icon: "error",
        title: "Date is Required",
        text: "To proceed, please choose a migration date located in the upper-right area of the screen",
      });
      return;
    }

    if (!fileRef.current?.value) {
      swal({
        icon: "warning",
        title: "No File Selected",
        text: "Please choose a file before proceeding.",
      });
      return;
    }

    setIsLoading(true);

    try {
      await axios
        .post(BASE_URL + "/migration/vendor_data_migrate", {
          data: csvData,
          lastDate,
        })
        .then((res) => {
          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Data Uploaded Successfully!",
              text: "Your supplier data has been migrated successfully.",
            });
          }
        });
    } catch (error) {
      console.error("Upload error:", error);
      swal({
        title: "Something went wrong",
        text: "Please contact your support immediately",
        icon: "error",
        timer: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    // Create CSV content as a string
    const csvContent = [
      "Supplier Name,Payable Amount/s,Asset Amount,Liability Amount",
      'Sample Vendor,"PHP~3000, USD~4343, PHP~43241","PHP~213213, USD~12","USD~41222"',
      'Sample Vendor2,"PHP~2000, PHP~5000",,',
    ].join("\n");

    // Create a blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create a link and click it
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Supplier Template.csv");
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="row p-2 mx-auto align-items-end">
        <div className="col-sm-8">
          {" "}
          <Form.Label className="fw-bold">Migrate Supplier's Data</Form.Label>
          <Form.Control
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            ref={fileRef}
          />
        </div>
        <div className="col-sm-4 mt-2">
          {isLoading ? (
            <p className="mb-2 fw-bold loading">
              Migrating<span className="dots"></span>
            </p>
          ) : (
            <>
              <Button
                variant="warning"
                className="mt-4 mx-1"
                onClick={handleDownload}
              >
                Download Template
              </Button>
              <Button className="mt-4" onClick={handleSendToServer}>
                Upload to Server
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Supplier_Migration;
