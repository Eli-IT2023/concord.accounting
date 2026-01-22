import { useRef, useState } from "react";
import { Form, Button } from "react-bootstrap";
import Papa from "papaparse";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import swal from "sweetalert";
import { isFileTemplateValid } from "../../../utils/validation";

const SalesMigration = ({ lastDate }) => {
  const fileRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState([]);

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
      complete: (result) => {
        const cleanedData = result.data.slice(3);
        const requiredColumns = [
          "Customer Name",
          "Receivable Amount/s",
          "Transaction Date (mm/dd/yyyy)",
          "Transaction Number",
        ];

        // Validation for empty file
        if (!cleanedData.length) {
          swal({
            icon: "warning",
            title: "No data found in file",
            text: "Please make sure the file has rows after the header.",
          }).then(() => (fileRef.current.value = ""));

          return;
        }

        // Validation for file format
        if (!isFileTemplateValid(cleanedData, requiredColumns)) {
          swal({
            icon: "warning",
            title: "File Format Mismatch",
            text: "Your file doesn't match the expected template for Sales Migration. Please download the sample file and try again.",
          }).then(() => (fileRef.current.value = ""));

          return;
        }

        // Get the data file
        setCsvData(cleanedData);
      },
    });
  };

  const handleDownload = () => {
    // Create Csv content as string
    const csvContent = [
      "Customer Name,Receivable Amount/s,Transaction Date (mm/dd/yyyy),Transaction Number",
      "Customer 1,184800,07/15/2025,S-001",
      "Customer 2,33250,08/16/2025,R-002",
      "Customer 3,214421.38,09/17/2025,S-003",
    ].join("\n");

    // Create blob url
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Create link
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Sales Receivable Template.csv");
    document.body.appendChild(link);
    link.click();

    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  const handleSendToServer = async () => {
    // if (lastDate === "") {
    //   swal({
    //     icon: "error",
    //     title: "Date is Required",
    //     text: "To proceed, please choose a migration date located in the upper-right area of the screen",
    //   });
    //   return;
    // }

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
        .post(BASE_URL + "/migration/sales-data-migrate", {
          data: csvData,
          lastDate,
        })
        .then((res) => {
          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Data Uploaded Successfully!",
              text: "Your sales receivable data has been migrated successfully.",
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

  return (
    <div>
      <div className="row p-2 mx-auto align-items-end">
        <div className="col-sm-8">
          {" "}
          <Form.Label className="fw-bold">
            Migrate Sales Receivable's Data{" "}
            <span className="text-muted fst-italic">
              (No Need Selection Of Month to Migrate)
            </span>
          </Form.Label>
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

export default SalesMigration;
