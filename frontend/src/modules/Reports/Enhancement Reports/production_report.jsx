import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import "../../../assets/css/style.css";
import NoAccess from "../../../assets/img/NoAccess.png";

import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";

import FinishProduct from "./components/production_report/finish_product_tab";
import RawMaterials from "./components/production_report/raw_materials_tab";
import OtherCategory from "./components/production_report/other_category_tab";
import DirectCosts from "./components/production_report/direct_cost_tab";

import { constant_productCategory } from "../../../constants/productOptions";
const ProductionReport1 = ({ authrztn }) => {
  const [showTable, setShowTable] = useState(false);

  const { module, id, fromdate, todate } = useParams();
  const [thisFromdate, setThisFromdate] = useState("");
  const [thisTodate, setThisTodate] = useState("");

  const [cutoffList, setCutoffList] = useState([]);
  const [selectedCutoff_id, setSelectedCutoff_id] = useState("");

  const navigate = useNavigate();

  const [rawMaterialTab, setRawMaterialTab] = useState([]);
  const [finishedMaterialTab, setFinishedMaterialTab] = useState([]);
  const [directCostsTab, setDirectCostsTab] = useState([]);

  // const getAssets = async (cutoffList_id, cutoff_fromdate, cutoff_todate) => {
  //   // console.log(`cutoffList_id: ${cutoffList_id}`);

  //   await axios
  //     .get(`${BASE_URL}/balance_sheet/getAssets`, {
  //       params: {
  //         cutoffList_id,
  //         cutoff_fromdate,
  //         cutoff_todate,
  //       },
  //     })
  //     .then((res) => {
  //       setAssets(res.data);
  //     });
  // };

  const reloadTable = async (cutoffList_id, cutoff_fromdate, cutoff_todate) => {
    await axios
      .get(BASE_URL + "/report_production/fetchRawProductNew", {
        params: {
          cutoffList_id,
          cutoff_fromdate,
          cutoff_todate,
        },
      })
      .then((res) => {
        setRawMaterialTab(res.data);
        // console.log(res.data);
      });

    await axios
      .get(BASE_URL + "/report_production/fetchFinishedProductNew", {
        params: {
          cutoffList_id,
          cutoff_fromdate,
          cutoff_todate,
        },
      })
      .then((res) => {
        setFinishedMaterialTab(res.data);
      });

    await axios
      .get(BASE_URL + "/report_production/direct-costs", {
        params: {
          cutoffList_id,
          cutoff_fromdate,
          cutoff_todate,
        },
      })
      .then((res) => {
        setDirectCostsTab(res.data);
      });
  };

  const getCutoff = async () => {
    await axios
      .get(`${BASE_URL}/cutoff/getCutoffs`)
      .then((res) => {
        const cutoffList_id = res.data[0].id;
        const cutoff_fromdate = res.data[0].from;
        const cutoff_todate = res.data[0].to;

        setCutoffList(res.data);
        setSelectedCutoff_id(cutoffList_id);
        setThisFromdate(cutoff_fromdate || "");
        setThisTodate(cutoff_todate || "");

        reloadTable(cutoffList_id, cutoff_fromdate, cutoff_todate);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (module && id && fromdate && todate) {
      setThisFromdate(fromdate);
      setThisTodate(todate);
    } else {
      setThisFromdate("");
      setThisTodate("");
    }
    getCutoff();
  }, []);

  // totals
  // const totalRawProduced = rawMaterialTab.reduce(
  //   (acc, data) => acc + data.total_net_weight,
  //   0
  // );

  // Total Processing Unit
  const totalRawProduced = rawMaterialTab.reduce(
    (acc, value) => acc + value.totalWeight,
    0
  );

  // Total for Total Costing Column (Raw Materials)
  const totalRawCosting = rawMaterialTab.reduce(
    (acc, value) => acc + value.totalCosting,
    0
  );

  // Total Finished Unit
  const totalFinishedUnit = finishedMaterialTab.reduce(
    (acc, data) => acc + data.finishedUnit,
    0
  );

  // Total for Total Costing Column (Finished Product)
  const totalCosting = finishedMaterialTab.reduce(
    (acc, value) => acc + value.totalCosting,
    0
  );

  // Total Defective Unit for Production Overview
  const totalDefectiveUnit = totalRawProduced - totalFinishedUnit;

  // Average Production Efficiency for Production Overview
  const averageProductionEfficiency =
    (totalFinishedUnit / totalRawProduced) * 100;

  // Average Defective Unit for Production Overview
  const averageDefectiveUnit = (totalDefectiveUnit / totalRawProduced) * 100;

  // const averagePercentagePerGroup =
  //   finishedMaterialTab.reduce(
  //     (acc, data) =>
  //       acc +
  //       (data.total_weight_in2
  //         ? (data.total_net_weight2 / data.total_weight_in2) * 100
  //         : 0),
  //     0
  //   ) / finishedMaterialTab.length;

  // const defectivePercentagePerGroup =
  //   finishedMaterialTab.reduce(
  //     (acc, data) =>
  //       acc +
  //       (data.total_weight_in2
  //         ? (data.total_defective2 / data.total_weight_in2) * 100
  //         : 0),
  //     0
  //   ) / finishedMaterialTab.length;

  // Total of Direct Cost
  const totalDirectCosts = directCostsTab.reduce(
    (acc, value) => acc + value.directCosts,
    0
  );

  // Total Distribute Cost
  const totalDistributeCost = directCostsTab.reduce(
    (acc, value) =>
      acc + (totalFinishedUnit ? value.directCosts / totalFinishedUnit : 0),
    0
  );

  // Fix the handleCutoffChange function
  const handleCutoffChange = (value) => {
    console.log(value);
    setSelectedCutoff_id(value);
    // Ensure dates are strings, use empty string as fallback
    const cutoff_fromdate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).from ||
      "";
    const cutoff_todate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).to || "";

    setThisFromdate(cutoff_fromdate);
    setThisTodate(cutoff_todate);

    reloadTable(value, cutoff_fromdate, cutoff_todate);
  };

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  const exportToExcel = () => {
    // Create a workbook
    const wb = XLSX.utils.book_new();

    // Prepare data for Excel export in columnar format
    const excelData = [];

    // Add title and cutoff information
    excelData.push(["PRODUCTION REPORT", "", "", "", "", "", ""]);

    // Safely get cutoff information
    const selectedCutoff = cutoffList.find(
      (cutoff) => String(cutoff.id) === String(selectedCutoff_id)
    );
    const cutoffName = selectedCutoff ? selectedCutoff.name : "N/A";
    const fromDate = thisFromdate || "N/A";
    const toDate = thisTodate || "N/A";

    excelData.push(["Cutoff Name:", cutoffName, "", "", "", "", ""]);
    excelData.push(["From:", fromDate, "", "To:", toDate, "", ""]);
    excelData.push([""]); // Empty row

    // Production Overview Section
    excelData.push(["PRODUCTION OVERVIEW", "", "", "", "", "", ""]);
    excelData.push([
      "Production Details",
      "Description",
      "Value",
      "",
      "",
      "",
      "",
    ]);

    // Production Overview Rows
    excelData.push([
      "Production Details of Raw Materials Unit",
      "Total of Raw Materials Unit",
      Number(totalRawProduced).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Production Details of Defective Unit",
      "Total Defective Unit",
      Number(totalDefectiveUnit).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "Production of Finished Product",
      "Total Finished Unit",
      Number(totalFinishedUnit).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "",
      "Average Production Efficiency %",
      isNaN(averageProductionEfficiency)
        ? "0.00"
        : averageProductionEfficiency.toFixed(2) + "%",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      "",
      "Average Defective Unit %",
      isNaN(averageDefectiveUnit)
        ? "0.00"
        : averageDefectiveUnit.toFixed(2) + "%",
      "",
      "",
      "",
      "",
    ]);

    excelData.push([""]); // Empty row

    // Finished Product Section
    excelData.push(["FINISHED PRODUCT DETAILS", "", "", "", "", "", ""]);
    excelData.push([
      "Product Code",
      "Product Name",
      // "Processing Raw Materials Unit",
      // "Defective Unit",
      "Finished Unit",
      "Total Costing",
      "Average Price",
      "Final Average price of finished goods",
      // "Production Efficiency",
      // "Defective Unit (%)",
    ]);

    // Finished Product Rows
    finishedMaterialTab.forEach((data) => {
      excelData.push([
        data.product_list.product_code || "",
        data.product_list.product_name || "",
        Number(data.finishedUnit || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.totalCosting || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.averagePrice || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.averagePrice + totalDistributeCost || 0).toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        ),
        // data.production_efficiency2 || "",
        // data.defective_loss2 || "",
      ]);
    });

    // Finished Product Totals
    excelData.push([
      "Total Units:",
      "",
      Number(totalFinishedUnit).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      Number(totalCosting).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      "",
      "",
      "",
    ]);

    excelData.push([""]); // Empty row

    // Raw Materials Section
    excelData.push(["RAW MATERIALS DETAILS", "", "", "", "", "", ""]);
    excelData.push([
      "Product Code",
      "Raw Materials Name",
      "Processing Unit",
      "Average Unit Price",
      "Total Costing / Raw Materials",
      "",
      "",
    ]);

    // Raw Materials Rows
    rawMaterialTab.forEach((data) => {
      excelData.push([
        data.product_list.product_code || "",
        data.product_list.product_name || "",
        Number(data.totalWeight || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.averageUnitPrice || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Number(data.totalCosting || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        "",
        "",
      ]);
    });

    // Raw Materials Totals
    excelData.push([
      "Total Processing Unit:",
      "",
      Number(totalRawProduced || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      "",
      Number(totalRawCosting || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      "",
      "",
    ]);

    excelData.push([""]); // Empty row

    // Direct Costs Section
    excelData.push(["DIRECT COSTS DETAILS", "", "", "", "", "", ""]);
    excelData.push([
      "Expenses Category",
      "Direct Costs",
      "Distribute the cost",
      "",
      "",
      "",
      "",
    ]);

    // Direct Costs Row
    directCostsTab.forEach((data) => {
      excelData.push([
        data.sub_type,
        data.directCosts.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
        (totalFinishedUnit
          ? data.directCosts / totalFinishedUnit
          : 0
        ).toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
        "",
        "",
        "",
        "",
      ]);
    });

    // Direct Costs Totals
    excelData.push([
      "Total Direct Costs:",
      totalDirectCosts.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }),
      totalDistributeCost.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }),
      "",
      "",
      "",
      "",
    ]);

    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Apply styling by setting column widths and cell styles
    const wscols = [
      { wch: 35 }, // First column width
      { wch: 35 }, // Second column
      { wch: 25 }, // Third column
      { wch: 20 }, // Fourth column
      { wch: 20 }, // Fifth column
      { wch: 25 }, // Sixth column
      { wch: 20 }, // Seventh column
    ];
    ws["!cols"] = wscols;

    // Apply styling to headers and totals
    for (let i = 0; i < excelData.length; i++) {
      // Create cell addresses for all columns
      const cellAddresses = [];
      for (let c = 0; c < 7; c++) {
        cellAddresses.push(XLSX.utils.encode_cell({ r: i, c }));
      }

      // Style main title
      if (excelData[i][0] === "PRODUCTION REPORT") {
        cellAddresses.forEach((addr) => {
          if (!ws[addr]) ws[addr] = {};
          ws[addr].s = {
            font: { sz: 16, bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "D3D3D3" } },
          };
        });
      }

      // Style section headers
      if (
        excelData[i][0] === "PRODUCTION OVERVIEW" ||
        excelData[i][0] === "FINISHED PRODUCT DETAILS" ||
        excelData[i][0] === "RAW MATERIALS DETAILS"
      ) {
        cellAddresses.forEach((addr) => {
          if (!ws[addr]) ws[addr] = {};
          ws[addr].s = {
            font: { sz: 14, bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "E6E6E6" } },
          };
        });
      }

      // Style column headers
      if (
        excelData[i][0] === "Product Code" ||
        excelData[i][0] === "Production Details" ||
        excelData[i][1] === "Description"
      ) {
        cellAddresses.forEach((addr) => {
          if (!ws[addr]) ws[addr] = {};
          ws[addr].s = {
            font: { sz: 12, bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "F0F0F0" } },
          };
        });
      }

      // Style totals
      if (
        excelData[i][1] === "Total Units:" ||
        excelData[i][1] === "Total Processing Unit:"
      ) {
        cellAddresses.forEach((addr, idx) => {
          if (!ws[addr]) ws[addr] = {};
          ws[addr].s = {
            font: { sz: 12, bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "D3D3D3" } },
          };

          // Format numeric totals
          if (idx === 2 || idx === 3 || idx === 4) {
            ws[addr].s.numFmt = "#,##0.00";
          }
        });
      }

      // Format all number cells
      if (
        i > 4 &&
        typeof excelData[i][2] === "string" &&
        excelData[i][2].includes(",")
      ) {
        cellAddresses.forEach((addr, idx) => {
          if (!ws[addr]) ws[addr] = {};
          if (idx === 2 || idx === 3 || idx === 4) {
            ws[addr].s = { numFmt: "#,##0.00" };
          }
        });
      }
    }

    // Merge cells for title and section headers
    // ws["!merges"] = [
    //   // Merge title row
    //   { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    //   // Merge cutoff name row
    //   { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    //   // Merge section headers
    //   { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } },
    //   { s: { r: 11, c: 0 }, e: { r: 11, c: 6 } },
    //   {
    //     s: { r: 11 + finishedMaterialTab.length + 3, c: 0 },
    //     e: { r: 11 + finishedMaterialTab.length + 3, c: 6 },
    //   },
    // ];

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Production Report");

    // Generate the Excel file
    const fileName = `Production_Report_${fromDate}_to_${toDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {authrztn.includes("Reporting-View") ? (
        <>
          <div className="w-100 p-2 d-flex flex-row justify-content-between">
            <div className="d-flex flex-column title-custom">
              <span className="fs-3 text-uppercase">Production Report</span>
            </div>
            <div>
              <div>
                <button className="btn btn-primary" onClick={toggleTable}>
                  {showTable ? "Hide Overview" : "Show Overview"}
                </button>
                {authrztn.includes("Reporting-IE") && (
                  <Button
                    className="ms-2"
                    variant="success"
                    onClick={exportToExcel}
                  >
                    Export to Excel
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="w-100 row mx-auto mt-2">
            <h6 className="mb-2">Accounting Period</h6>
            <div className="col-sm mb-2">
              <span>Cutoff</span>
              <Form.Select
                value={selectedCutoff_id}
                onChange={(e) => handleCutoffChange(e.target.value)}
                className="form-select"
                onMouseDown={(e) => {
                  if (cutoffList.length === 0) {
                    e.preventDefault();
                    swal({
                      icon: "warning",
                      title: "No Cutoff Found",
                      text: "No cutoff records found. Please create a cutoff first in Monthly Cutoff Module.",
                    });
                    return;
                  }
                }}
              >
                {cutoffList.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-sm mb-2">
              <span>From</span>
              {/* <input
            value={thisFromdate}
            type="date"
            readOnly
            onChange={(e) => setThisFromdate(e.target.value)}
            name=""
            className="form-control"
            id=""
          /> */}
              <DatePicker
                selected={thisFromdate}
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>
            <div className="col-sm mb-2">
              <span>To</span>
              {/* <input
            value={thisTodate}
            type="date"
            readOnly
            onChange={(e) => setThisTodate(e.target.value)}
            name=""
            className="form-control"
            id=""
          /> */}
              <DatePicker
                selected={thisTodate}
                dateFormat="MMM/dd/yyyy"
                className="form-control"
                readOnly
              />
            </div>
            {!module && (
              <div className="col-sm d-flex flex-row align-items-end mb-2 filter-btn-container d-none">
                <button className="btn">Apply Filter</button>
                <button className="btn btn-secondary">Clear Filter</button>
              </div>
            )}
            <div className="col-sm"></div>
          </div>
          <div className="w-100 container-fluid mt-2">
            <div className="d-flex justify-content-between align-items-center">
              <h5>Production Overview</h5>
            </div>

            <CSSTransition
              in={showTable}
              timeout={300}
              classNames="slide"
              unmountOnExit
            >
              <div className="table-responsive mt-3">
                <table className="table table-bordered table-striped">
                  <tbody>
                    <tr>
                      <td>Production Details of Raw Materials Unit</td>
                      <td>Total of Raw Materials Unit</td>
                      <td>
                        {Number(totalRawProduced).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td>Production Details of Defective Unit</td>
                      <td>Total Defective Unit</td>
                      <td>
                        {Number(totalDefectiveUnit).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td>Production of Finished Product</td>
                      <td>Total Finished Unit</td>
                      <td>
                        {Number(totalFinishedUnit).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td>Average Production Efficiency %</td>
                      <td>
                        {isNaN(averageProductionEfficiency)
                          ? "0.00"
                          : averageProductionEfficiency.toFixed(2)}
                        %
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td>Average Defective Unit %</td>
                      <td>
                        {isNaN(averageDefectiveUnit)
                          ? "0.00"
                          : averageDefectiveUnit.toFixed(2)}
                        %
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CSSTransition>
          </div>

          <div className="container-fluid mt-2">
            <Tabs
              defaultActiveKey="finishedProduct"
              id="uncontrolled-tab-example"
              className="mb-3"
            >
              {/* Finished Product Tab */}
              <Tab eventKey="finishedProduct" title="Finished Product">
                <FinishProduct
                  finishedMaterialTab={finishedMaterialTab}
                  totalDistributeCost={totalDistributeCost}
                  totalFinishedUnit={totalFinishedUnit}
                  totalCosting={totalCosting}
                />
              </Tab>

              {/* Raw Materials Tab */}
              <Tab eventKey="rawMaterials" title="Raw Materials">
                <RawMaterials
                  rawMaterialTab={rawMaterialTab}
                  totalRawProduced={totalRawProduced}
                  totalRawCosting={totalRawCosting}
                />
              </Tab>

              {/* commented since d na pala need kasi automatic naman mapupunta sa tab if ang ibang category is ginamit as Raw or Finish sa PRoduction */}
              {/* {constant_productCategory
                .filter(
                  (category) =>
                    category !== "Raw Materials" &&
                    category !== "Finish Product"
                )
                .map((category) => (
                  <Tab eventKey={category} title={category}>
                    <OtherCategory
                      thisFromdate={thisFromdate}
                      thisTodate={thisTodate}
                      categoryName={category}
                      selectedCutoff_id={selectedCutoff_id}
                    />
                  </Tab>
                ))} */}

              {/* Direct Costs Tab */}
              <Tab eventKey="directCosts" title="Direct Costs">
                <DirectCosts
                  directCostsTab={directCostsTab}
                  totalFinishedUnit={totalFinishedUnit}
                  totalDirectCosts={totalDirectCosts}
                  totalDistributeCost={totalDistributeCost}
                />
              </Tab>
            </Tabs>
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

export default ProductionReport1;
