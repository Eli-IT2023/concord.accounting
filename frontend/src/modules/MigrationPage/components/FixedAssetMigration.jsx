import { useRef, useState } from "react";
import { Form, Button } from "react-bootstrap";
import Papa from "papaparse";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import swal from "sweetalert";
import { isFileTemplateValid } from "../../../utils/validation";

const FixedAssetMigration = ({ lastDate }) => {
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
          "Fixed Asset Name",
          "Quantity",
          "Total Cost",
          "Months to Pay",
          "Depreciation Amount",
          "Forecast Start Date",
          "Number of Paid Forecast",
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
            text: "Your file doesn't match the expected template for Fixed Asset Migration. Please download the sample file and try again.",
          }).then(() => (fileRef.current.value = ""));

          return;
        }

        setCsvData(cleanedData);
      },
    });
  };

  const handleDownload = () => {
    // Create Csv content as string
    const csvContent = [
      "Fixed Asset Name,Quantity,Total Cost,Months to Pay,Depreciation Amount,Forecast Start Date,Number of Paid Forecast",
      "Sample Asset,10,10,3.2,3.125,24/09/2025,1",
      "Machinery Asset,10,100000,10.2,9803.921568627451,24/09/2025,5",
      "Fixed Asset,20,846640,4,211660,24/09/2025,2",
    ].join("\n");

    // Create blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Create link
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Fixed Asset Template.csv");
    document.body.appendChild(link);
    link.click();

    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
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
        .post(BASE_URL + "/migration/fixed-asset/data-migrate", {
          data: csvData,
          lastDate,
        })
        .then((res) => {
          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Data Uploaded Successfully!",
              text: "Your fixed asset data has been migrated successfully.",
            });
          }
        });
    } catch (error) {
      console.error("Upload error:", error);

      if (error.response && error.response.status === 409) {
        swal({
          icon: "error",
          title: "Duplicate Records",
          text: "All fixed assets you’re trying to upload already exist in the system.",
        });
        return;
      }

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

  console.log(csvData);

  return (
    <div>
      <div className="row p-2 mx-auto align-items-end">
        <div className="col-sm-8">
          {" "}
          <Form.Label className="fw-bold">
            Migrate Fixed Asset's Data
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

export default FixedAssetMigration;
