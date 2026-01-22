import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import { MultiSelect } from "react-multi-select-component";
import { Table, Form, Row, Col, InputGroup, Button } from "react-bootstrap";
import "../../assets/css/style.css";
import swal from "sweetalert";
import jsPDF from "jspdf";
import "jspdf-autotable";
import maskCurrency from "../../utils/maskCurrency";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import DatePicker from "react-datepicker";

const BankBudgeting = ({ authrztn, roleType }) => {
  const [selectedOptionsS3, setSelectedOptionS3] = useState([]);
  const [subject2, setSubject2] = useState([]);
  const [selectedSubject2, setSelectedSubject2] = useState([]);
  const [subject3, setSubject3] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [module, setModule] = useState("Payable");
  const [dateTo, setDateTo] = useState("");

  const [collectionsDateFrom, setCollectionsDateFrom] = useState("");
  const [collectionsDateTo, setCollectionsDateTo] = useState("");
  const [disbursementDateFrom, setDisbursementDateFrom] = useState("");
  const [disbursementDateTo, setDisbursementDateTo] = useState("");

  const [availableFunds, setAvailableFunds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const onInputFloat = (e) => {
    const value = e.target.value;
    const newValue = value.replace(/[^0-9.-]+/g, "");
    e.target.value = newValue;
  };
  const subject1Options = async () => {
    axios
      .get(`${BASE_URL}/accountListSub/getSubject`, {
        params: {
          account_selected: "Account-List",
        },
      })
      .then((res) => {
        setSubject2(res.data);
        setIsLoading(false);
      });
  };

  const add_projected_savings = selectedOptionsS3.reduce(
    (sum, data) =>
      sum + parseFloat(String(data.projected_savings).replace(/,/g, "")) || 0,
    0
  );

  const displayed_available_funds = availableFunds - add_projected_savings;

  const total_disbursement = selectedOptionsS3.reduce(
    (sum, data) => sum + parseFloat(data.disbursement) || 0,
    0
  );

  const total_available_funds = selectedOptionsS3.reduce(
    (sum, data) =>
      sum + parseFloat(String(data.available_funds).replace(/,/g, "")) || 0,
    0
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      subject1Options();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const subject3Options = subject3.map((option) => ({
    value: option.id,
    label: option.account_name,
    account_name: option.account_name,
    account_balance: option.amount,
    currency_name: option.currency.currency_name,
    currency_rate: option.currency.currency_rate,
    original_currency_rate: option.currency.currency_rate,
    disbursement: 0,
    projected_savings: 0,
    available_funds: option.amount * option.currency.currency_rate,
  }));

  const subject2Options = subject2.map((option) => ({
    value: option.id,
    label: option.subject_name,
    // account_name: option.account_name,
    // account_balance: option.amount,
    // currency_name: option.currency.currency_name,
    // currency_rate: option.currency.currency_rate,
    //   disbursement: 0,
    //   projected_savings: 0,
    // available_funds: option.amount * option.currency.currency_rate,
  }));

  const handleChange = (selected) => {
    setSelectedOptionS3(selected);
  };

  const handleSubject2Change = (selected) => {
    // const selectedSubject2 = e.target.value;
    setSelectedSubject2(selected);
    console.log(selected);

    if (selected.length === 0) {
      setSubject3([]);
      setSelectedOptionS3([]);
      setAvailableFunds(0);
      setSelectedSubject2([]);
      return;
    } else {
      axios
        .get(`${BASE_URL}/bankBudgeting/getSubject3`, {
          params: {
            subjectIdArray: selected,
          },
        })
        .then((res) => {
          console.log(res.data);
          setSubject3(res.data);
        });
    }
  };

  const handleInputChange = useCallback((optionValue, field, newValue) => {
    setSelectedOptionS3((prevOptions) =>
      prevOptions.map((option) => {
        if (option.value === optionValue) {
          const newValueFloat = newValue;

          let inputValue = newValueFloat.replace(/[^0-9.]/g, "");

          let [integerPart, decimalPart] = inputValue.split(".");

          if (integerPart) {
            integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          }

          let formattedValue =
            decimalPart !== undefined
              ? `${integerPart}.${decimalPart}`
              : integerPart;

          let updatedOption = { ...option, [field]: formattedValue };

          let formatAmountValue = inputValue.replace(/,/g, "");

          let numericValue = parseFloat(formatAmountValue);

          if (field === "currency_rate") {
            updatedOption.available_funds =
              option.account_balance * parseFloat(numericValue) -
              option.disbursement +
              parseFloat(String(option.projected_savings).replace(/,/g, ""));
          } else {
            updatedOption.available_funds =
              option.account_balance * option.currency_rate -
              (field === "disbursement"
                ? parseFloat(numericValue)
                : option.disbursement) +
              (field === "projected_savings"
                ? parseFloat(numericValue)
                : parseFloat(
                    String(option.projected_savings).replace(/,/g, "")
                  ));
          }

          return updatedOption;
        }
        return option;
      })
    );
  }, []);

  const handleModuleChange = () => {
    setModule(module === "Payable" ? "Collection" : "Payable");
  };

  const handleApplyFilter = async () => {
    try {
      let url = "";
      if (module === "Payable") {
        url = `/bankBudgeting/filterPayable`;
        setDisbursementDateFrom(dateFrom);
        setDisbursementDateTo(dateTo);
      } else {
        setCollectionsDateFrom(dateFrom);
        setCollectionsDateTo(dateTo);
        url = `/bankBudgeting/filterCollection`;
      }
      await axios
        .get(`${BASE_URL}${url}`, {
          params: {
            selectedOptionsS3,
            dateFrom,
            dateTo,
          },
        })
        .then((res) => {
          if (module === "Payable") {
            const mappedData = res.data.map((item) => ({
              account_balance: parseFloat(item.account_balance),
              account_name: item.account_name,
              available_funds:
                parseFloat(item.account_balance) *
                  parseFloat(item.currency_rate) -
                parseFloat(item.disbursement) +
                parseFloat(item.projected_savings),
              currency_name: item.currency_name,
              currency_rate: parseFloat(item.currency_rate),
              original_currency_rate: item.currency_rate,
              disbursement: parseFloat(item.disbursement),
              projected_savings: parseFloat(item.projected_savings),
              value: item.value,
            }));
            setSelectedOptionS3(mappedData);
          } else {
            setAvailableFunds(res.data);
          }
        });
    } catch (error) {
      console.error(error);
    }
  };

  const handleExport = () => {
    // Create a new document in landscape orientation
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Set a font that supports a wide range of characters
    doc.setFont("helvetica");

    // Add company logo (if available)
    // doc.addImage(companyLogo, 'PNG', 14, 10, 30, 30);

    // Add title
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102); // Dark blue color
    doc.text("Bank Budgeting Report", doc.internal.pageSize.width / 2, 20, {
      align: "center",
    });

    // Add horizontal line
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(14, 25, doc.internal.pageSize.width - 14, 25);

    // Add report details
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(
      `Cheques to be collected: PHP ${displayed_available_funds.toLocaleString(
        "en-US",
        {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }
      )}`,
      14,
      42
    );
    doc.text(
      `Collections Date: ${collectionsDateFrom || "N/A"} - ${
        collectionsDateTo || "N/A"
      }`,
      14,
      49
    );
    doc.text(
      `Disbursement Date: ${disbursementDateFrom || "N/A"} - ${
        disbursementDateTo || "N/A"
      }`,
      14,
      56
    );

    // Create table
    const tableColumn = [
      "Bank Account",
      "Current Balance",
      "Currency",
      "Exchange Rate",
      "Disbursement",
      "Projected Savings",
      "Available Funds",
    ];
    const tableRows = selectedOptionsS3.map((option) => [
      option.account_name,
      `${option.currency_name} ${option.account_balance.toLocaleString(
        "en-US",
        {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }
      )}`,
      option.currency_name,
      option.currency_rate === 1 ? "--" : option.currency_rate,
      option.disbursement,
      option.projected_savings,
      `PHP ${(isNaN(option.available_funds)
        ? 0
        : option.available_funds
      ).toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`,
    ]);

    doc.autoTable({
      startY: 65,
      head: [tableColumn],
      body: tableRows,
      styles: { font: "helvetica", fontSize: 9 },
      headStyles: { fillColor: [0, 51, 102], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 65, left: 14, right: 14 },
      tableWidth: "auto",
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    // Save the PDF
    doc.save("bank-budgeting.pdf");
  };

  const handleClearFilter = () => {
    setSelectedOptionS3([]);
    setDateFrom("");
    setDateTo("");
    setCollectionsDateFrom("");
    setCollectionsDateTo("");
    setDisbursementDateFrom("");
    setDisbursementDateTo("");
    setAvailableFunds(0);
    setModule("Payable");
    setSelectedSubject2("");
  };

  // Custom input for DatePicker to Prevent user typing/input
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <input
      type="text"
      className="form-control p-3 rounded-0 w-100"
      style={{
        cursor: "pointer",
        caretColor: "transparent",
      }}
      onClick={onClick}
      value={value}
      ref={ref}
      placeholder="Select Date"
    />
  ));

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {isLoading ? (
        <div className="loading-container">
          <ThreeDot
            variant="brick-stack"
            color="#6290FE"
            size="large"
            text="Loading Data..."
            textColor=""
          />
        </div>
      ) : authrztn.includes("BankBudgeting-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between mb-5">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Bank Budgeting</span>
            </div>
          </div>
          <div className="w-100 row mx-0 mt-3">
            <div className="col-sm mb-2">
              <label htmlFor="subject1">Subject 2</label>

              <MultiSelect
                options={subject2Options}
                value={selectedSubject2}
                onChange={handleSubject2Change}
                labelledBy="Select"
                className="w-100" // Full-width select component
                style={{
                  maxWidth: "1000px !important",
                }} // Apply max-width styling
              />
            </div>
            <div className="col-sm mb-2">
              <label htmlFor="subject2">Subject 3</label>
              <MultiSelect
                options={subject3Options}
                value={selectedOptionsS3}
                onChange={handleChange}
                labelledBy="Select"
                // className="w-100" // Full-width select component
                // style={{ maxWidth: "300px !important" }} // Apply max-width styling
              />
            </div>
            <div className="col-sm"></div>
            <div className="col-sm"></div>
            <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
              <div
                className={`text-end w-100 ${
                  selectedOptionsS3.length > 0 &&
                  "d-flex flex-nowrap text-nowrap"
                }`}
              >
                <button
                  className="btn btn-primary mx-2"
                  onClick={handleApplyFilter}
                  disabled={selectedOptionsS3.length === 0}
                >
                  Apply Filter
                </button>

                {selectedOptionsS3.length > 0 && (
                  <>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={handleClearFilter}
                    >
                      Clear Filter
                    </button>

                    <button
                      className="btn btn-outline-success mx-2"
                      onClick={handleExport}
                    >
                      {" "}
                      <i className="fa-solid fa-upload me-1 mx-2"></i> Export
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="w-100 d-flex flex-row justify-content-center align-items-center px-2 mt-2">
            <div className="col-sm mb-2">
              <div className="mb-3 input-group" style={{ zIndex: 0 }}>
                <InputGroup.Text>
                  <Button onClick={handleModuleChange}>{module}</Button>
                </InputGroup.Text>
                {/* <Form.Control
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                /> */}
                <div className="flex-grow-1">
                  <DatePicker
                    selected={dateFrom}
                    dateFormat="MMM dd, yyyy"
                    onChange={(date) => {
                      setDateFrom(date);
                    }}
                    className="form-control p-2"
                    customInput={<CustomInput />}
                  />
                </div>
                {/* <Form.Control
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                /> */}
                <div className="flex-grow-1">
                  <DatePicker
                    selected={dateTo}
                    dateFormat="MMM dd, yyyy"
                    onChange={(date) => {
                      setDateTo(date);
                    }}
                    className="form-control p-2"
                    customInput={<CustomInput />}
                  />
                </div>
              </div>
            </div>

            <div className="col-sm mx-2 d-flex flex-row align-items-end filter-btn-container"></div>
          </div>
          <div className="w-100 mt-2 p-3">
            <span style={{ fontWeight: "500" }}>
              Available Funds/Collection Cheques: {"   "}
              <span className="text-primary">
                {roleType?.includes("Management") ? (
                  displayed_available_funds.toLocaleString("en-US", {
                    style: "currency",
                    currency: "PHP",
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })
                ) : (
                  <span
                    className="masked-value"
                    style={{ fontSize: "1rem", fontWeight: "bold" }}
                  >
                    {maskCurrency(100)}
                  </span>
                )}
              </span>
            </span>
          </div>
          <div className="w-100 mb-2 p-3">
            <Table hover responsive className="rounded reports-custom-table">
              <thead>
                <tr className="table-info">
                  <th className="text-center">Bank Account</th>
                  <th
                    className={
                      roleType?.includes("Management")
                        ? "text-center"
                        : "d-none"
                    }
                  >
                    Current Balance
                  </th>
                  <th className="text-center">Currency</th>
                  <th className="text-center">Exchange Rate</th>
                  <th
                    className={
                      roleType?.includes("Management")
                        ? "text-center"
                        : "d-none"
                    }
                  >
                    Disbursement
                  </th>
                  <th
                    className={
                      roleType?.includes("Management")
                        ? "text-center"
                        : "d-none"
                    }
                  >
                    Projected Savings
                  </th>
                  <th
                    className={
                      roleType?.includes("Management")
                        ? "text-center"
                        : "d-none"
                    }
                  >
                    Available Funds
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedOptionsS3.map((option) => (
                  <tr key={option.value}>
                    <td>{option.account_name}</td>
                    <td
                      className={
                        roleType?.includes("Management") ? "" : "d-none"
                      }
                    >
                      {option.account_balance.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>{option.currency_name}</td>
                    <td>
                      <Form.Control
                        type="text"
                        value={
                          option.original_currency_rate == 1
                            ? "--"
                            : option.currency_rate
                        }
                        readOnly={option.original_currency_rate === 1}
                        onChange={(e) =>
                          handleInputChange(
                            option.value,
                            "currency_rate",
                            e.target.value
                          )
                        }
                        onInput={onInputFloat}
                      />
                    </td>
                    <td
                      className={
                        roleType?.includes("Management") ? "" : "d-none"
                      }
                    >
                      <Form.Control
                        type="text"
                        value={option.disbursement.toLocaleString("en-US", {
                          style: "currency",
                          currency: "PHP",
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                        readOnly
                        onChange={(e) => {
                          handleInputChange(
                            option.value,
                            "disbursement",
                            e.target.value
                          );
                        }}
                        onInput={onInputFloat}
                      />
                    </td>
                    <td
                      className={
                        roleType?.includes("Management") ? "" : "d-none"
                      }
                    >
                      <Form.Control
                        type="text"
                        value={option.projected_savings}
                        onChange={(e) =>
                          handleInputChange(
                            option.value,
                            "projected_savings",
                            e.target.value
                          )
                        }
                        onInput={onInputFloat}
                      />
                    </td>
                    <td
                      className={
                        roleType?.includes("Management") ? "" : "d-none"
                      }
                    >
                      {(isNaN(option.available_funds)
                        ? 0
                        : option.available_funds
                      ).toLocaleString("en-US", {
                        style: "currency",
                        currency: "PHP",
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td></td>
                  <td
                    className={roleType?.includes("Management") ? "" : "d-none"}
                  ></td>
                  <td></td>
                  <td></td>
                  <td
                    className={
                      roleType?.includes("Management")
                        ? "text-center"
                        : "d-none"
                    }
                  >
                    <Form.Control
                      type="text"
                      value={total_disbursement.toLocaleString("en-US", {
                        style: "currency",
                        currency: "PHP",
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                      readOnly
                    />
                  </td>
                  <td
                    className={
                      roleType?.includes("Management")
                        ? "text-center"
                        : "d-none"
                    }
                  >
                    <Form.Control
                      type="text"
                      value={add_projected_savings.toLocaleString("en-US", {
                        style: "currency",
                        currency: "PHP",
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                      readOnly
                    />
                  </td>
                  <td
                    className={
                      roleType?.includes("Management")
                        ? "text-center"
                        : "d-none"
                    }
                  >
                    <Form.Control
                      type="text"
                      value={total_available_funds.toLocaleString("en-US", {
                        style: "currency",
                        currency: "PHP",
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                      readOnly
                    />
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </>
      ) : (
        <div className="no-access">
          <img src={NoAccess} alt="NoAccess" className="no-access-img" />
          <h3>You don't have access to this function.</h3>
        </div>
      )}
    </div>
  );
};

export default BankBudgeting;
