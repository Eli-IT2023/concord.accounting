import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { Link } from "react-router-dom";

const BossReport = () => {
  const liabilitiesData = [
    { index: 101, description: "LONG TERM LOAN (长期借款)", total: "₱0.00" },
    { index: 102, description: "BONDS PAYABLE (应付债卷)", total: "₱0.00" },
    {
      index: 103,
      description: "LONG TERM PAYABLE (长期应付款)",
      total: "₱0.00",
    },
    {
      index: 106,
      description: "FACTORY CONSTRUCTION (厂房建造应付款)",
      total: "₱0.00",
    },
    {
      index: 108,
      description: "OTHER LONG TERM LIABILITIES (其他长期负债)",
      total: "₱0.00",
    },
    {
      index: 110,
      description: "TOTAL LONG TERM LIABILITIES (长期负债合计)",
      total: "₱0.00",
    },
  ];

  const sampleData = [
    {
      year: 2021,
      metro_huafei: 5000,
      sotanghon: 3000,
      muntinlupa: 2500,
      muntinlupa_2: 1500,
      batangas: 4500,
      batangas_2: 3200,
      iloilo: 2800,
      iloilo_2: 3600,
      total: 26100,
    },
    {
      year: 2022,
      metro_huafei: 4500,
      sotanghon: 2000,
      muntinlupa: -1200,
      muntinlupa_2: 3500,
      batangas: 4200,
      batangas_2: 3100,
      iloilo: 2700,
      iloilo_2: 3700,
      total: 22500,
    },
    {
      year: 2023,
      metro_huafei: 7000,
      sotanghon: -500,
      muntinlupa: 2300,
      muntinlupa_2: 1500,
      batangas: 4100,
      batangas_2: 2900,
      iloilo: 2500,
      iloilo_2: 3300,
      total: 24100,
    },
    {
      year: 2024,
      metro_huafei: -3000,
      sotanghon: 2500,
      muntinlupa: 1000,
      muntinlupa_2: 2000,
      batangas: 3800,
      batangas_2: 3000,
      iloilo: 2600,
      iloilo_2: 3500,
      total: 15400,
    },
    {
      year: 2025,
      metro_huafei: 6000,
      sotanghon: 4000,
      muntinlupa: 2700,
      muntinlupa_2: 3200,
      batangas: 4900,
      batangas_2: 3300,
      iloilo: 2900,
      iloilo_2: 4000,
      total: 31000,
    },
    {
      year: 2026,
      metro_huafei: 5500,
      sotanghon: 3000,
      muntinlupa: 1200,
      muntinlupa_2: 2500,
      batangas: 4600,
      batangas_2: 2800,
      iloilo: 2600,
      iloilo_2: 3800,
      total: 26000,
    },
    {
      year: 2027,
      metro_huafei: 5200,
      sotanghon: 3500,
      muntinlupa: 1600,
      muntinlupa_2: 2700,
      batangas: 4200,
      batangas_2: 2900,
      iloilo: 2500,
      iloilo_2: 3900,
      total: 26500,
    },
    {
      year: 2028,
      metro_huafei: -2000,
      sotanghon: 3000,
      muntinlupa: 1800,
      muntinlupa_2: 2400,
      batangas: 4000,
      batangas_2: 2600,
      iloilo: 2700,
      iloilo_2: 3700,
      total: 18200,
    },
    {
      year: 2029,
      metro_huafei: 5700,
      sotanghon: 3200,
      muntinlupa: 2100,
      muntinlupa_2: 3000,
      batangas: 4500,
      batangas_2: 3500,
      iloilo: 2900,
      iloilo_2: 3600,
      total: 28500,
    },
    {
      year: 2030,
      metro_huafei: 5300,
      sotanghon: 4000,
      muntinlupa: 2500,
      muntinlupa_2: 3500,
      batangas: 4700,
      batangas_2: 3300,
      iloilo: 2800,
      iloilo_2: 4200,
      total: 30300,
    },
    {
      year: 2031,
      metro_huafei: 5600,
      sotanghon: 3100,
      muntinlupa: 2200,
      muntinlupa_2: 3300,
      batangas: 4600,
      batangas_2: 3400,
      iloilo: 2500,
      iloilo_2: 3900,
      total: 28600,
    },
    {
      year: 2032,
      metro_huafei: 5100,
      sotanghon: -1000,
      muntinlupa: 2000,
      muntinlupa_2: 3100,
      batangas: 4200,
      batangas_2: 2900,
      iloilo: 2300,
      iloilo_2: 3700,
      total: 22300,
    },
    {
      year: 2033,
      metro_huafei: 6000,
      sotanghon: 3500,
      muntinlupa: 2800,
      muntinlupa_2: 3300,
      batangas: 4900,
      batangas_2: 3600,
      iloilo: 3000,
      iloilo_2: 4200,
      total: 31300,
    },
    {
      year: 2034,
      metro_huafei: 5400,
      sotanghon: 2800,
      muntinlupa: 2100,
      muntinlupa_2: 3200,
      batangas: 4700,
      batangas_2: 3100,
      iloilo: 2500,
      iloilo_2: 4000,
      total: 27800,
    },
    {
      year: 2035,
      metro_huafei: 5900,
      sotanghon: 3700,
      muntinlupa: 2600,
      muntinlupa_2: 3400,
      batangas: 4600,
      batangas_2: 3300,
      iloilo: 2700,
      iloilo_2: 4100,
      total: 30300,
    },
  ];

  const columns = [
    {
      name: "Year",
      selector: (row) => row.year,
    },
    {
      name: "Metro Huafei",
      selector: (row) => row.metro_huafei,
    },
    {
      name: "Sotanghon",
      selector: (row) => row.sotanghon,
    },
    {
      name: "Muntinlupa",
      selector: (row) => row.muntinlupa,
    },
    {
      name: "Muntinlupa II",
      selector: (row) => row.muntinlupa_2,
    },
    {
      name: "Batangas",
      selector: (row) => row.batangas,
    },
    {
      name: "Batangas II",
      selector: (row) => row.batangas_2,
    },
    {
      name: "Iloilo",
      selector: (row) => row.iloilo,
    },
    {
      name: "Iloilo II",
      selector: (row) => row.iloilo_2,
    },
    {
      name: "合计 Total",
      selector: (row) => row.total,
    },
  ];

  const accountReceivable = [
    {
      index: 101,
      description: "Factory A",
      total: "₱150,000.00",
      balance: "₱50,000.00",
    },
    {
      index: 102,
      description: "Factory B",
      total: "₱200,000.00",
      balance: "₱80,000.00",
    },
    {
      index: 103,
      description: "Factory C",
      total: "₱180,000.00",
      balance: "₱60,000.00",
    },
    {
      index: 104,
      description: "Factory D",
      total: "₱220,000.00",
      balance: "₱90,000.00",
    },
    {
      index: 105,
      description: "Factory E",
      total: "₱160,000.00",
      balance: "₱55,000.00",
    },
    {
      index: 106,
      description: "Factory F",
      total: "₱240,000.00",
      balance: "₱100,000.00",
    },
    {
      index: 107,
      description: "Factory G",
      total: "₱190,000.00",
      balance: "₱70,000.00",
    },
    {
      index: 108,
      description: "Factory H",
      total: "₱230,000.00",
      balance: "₱85,000.00",
    },
    {
      index: 109,
      description: "Factory I",
      total: "₱210,000.00",
      balance: "₱75,000.00",
    },
    {
      index: 110,
      description: "Factory J",
      total: "₱250,000.00",
      balance: "₱110,000.00",
    },
    {
      index: 111,
      description: "Factory K",
      total: "₱170,000.00",
      balance: "₱65,000.00",
    },
    {
      index: 112,
      description: "Factory L",
      total: "₱260,000.00",
      balance: "₱115,000.00",
    },
    {
      index: 113,
      description: "Factory M",
      total: "₱200,000.00",
      balance: "₱80,000.00",
    },
    {
      index: 114,
      description: "Factory N",
      total: "₱180,000.00",
      balance: "₱60,000.00",
    },
    {
      index: 115,
      description: "Factory O",
      total: "₱220,000.00",
      balance: "₱90,000.00",
    },
  ];

  const fixedAssets = [
    {
      index: 101,
      description: "Machinery A",
      original: "₱1,500,000.00",
      depriciation: "₱500,000.00",
      remaining: "₱1,000,000.00",
    },
    {
      index: 102,
      description: "Machinery B",
      original: "₱2,000,000.00",
      depriciation: "₱800,000.00",
      remaining: "₱1,200,000.00",
    },
    {
      index: 103,
      description: "Vehicle A",
      original: "₱1,800,000.00",
      depriciation: "₱600,000.00",
      remaining: "₱1,200,000.00",
    },
    {
      index: 104,
      description: "Building A",
      original: "₱5,000,000.00",
      depriciation: "₱1,500,000.00",
      remaining: "₱3,500,000.00",
    },
    {
      index: 105,
      description: "Computer Equipment",
      original: "₱1,200,000.00",
      depriciation: "₱400,000.00",
      remaining: "₱800,000.00",
    },
    {
      index: 106,
      description: "Furniture A",
      original: "₱600,000.00",
      depriciation: "₱200,000.00",
      remaining: "₱400,000.00",
    },
    {
      index: 107,
      description: "Vehicle B",
      original: "₱2,300,000.00",
      depriciation: "₱700,000.00",
      remaining: "₱1,600,000.00",
    },
    {
      index: 108,
      description: "Machinery C",
      original: "₱1,700,000.00",
      depriciation: "₱500,000.00",
      remaining: "₱1,200,000.00",
    },
    {
      index: 109,
      description: "Furniture B",
      original: "₱1,000,000.00",
      depriciation: "₱300,000.00",
      remaining: "₱700,000.00",
    },
    {
      index: 110,
      description: "Building B",
      original: "₱4,500,000.00",
      depriciation: "₱1,200,000.00",
      remaining: "₱3,300,000.00",
    },
    {
      index: 111,
      description: "Machinery D",
      original: "₱2,000,000.00",
      depriciation: "₱700,000.00",
      remaining: "₱1,300,000.00",
    },
    {
      index: 112,
      description: "Vehicle C",
      original: "₱1,900,000.00",
      depriciation: "₱600,000.00",
      remaining: "₱1,300,000.00",
    },
    {
      index: 113,
      description: "Building C",
      original: "₱5,500,000.00",
      depriciation: "₱1,800,000.00",
      remaining: "₱3,700,000.00",
    },
    {
      index: 114,
      description: "Furniture C",
      original: "₱700,000.00",
      depriciation: "₱250,000.00",
      remaining: "₱450,000.00",
    },
    {
      index: 115,
      description: "Machinery E",
      original: "₱2,500,000.00",
      depriciation: "₱800,000.00",
      remaining: "₱1,700,000.00",
    },
  ];
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="d-flex flex-column title-custom p-2">
        <span className="fs-3 text-uppercase">Boss Report</span>
      </div>
      <div className="w-100 p-2">
        <Tabs
          defaultActiveKey="assetAccount"
          id="uncontrolled-tab-example"
          className="mb-3"
        >
          <Tab eventKey="assetAccount" title="Asset Account">
            <div className="container p-2">
              <div className="row mt-3">
                <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                  <button className="btn btn-outline-success w-100">
                    {" "}
                    <i className="fa-solid fa-upload me-1"></i> Export
                  </button>
                  <button className="btn btn-outline-secondary w-100 mx-2">
                    <i className="fa-solid fa-download me-1"></i> Import
                  </button>
                </div>
                <div className="col-sm mb-2"></div>
                <div className="col-sm mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"

                    // onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div className="row p-2">
                <div className="col-sm mb-3 p-3">
                  <Table
                    hover
                    responsive
                    className="rounded mt-3 reports-custom-table"
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th>YI LU JIA 经营核算表</th>
                        <th>Owner Equity</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liabilitiesData.map((item, index) => (
                        <tr
                          key={index}
                          className={item.index === 110 ? "table-info" : ""}
                        >
                          <td style={{ padding: "15px" }}>{item.index}</td>
                          <td style={{ padding: "15px" }}>
                            {item.description}
                          </td>
                          <td style={{ padding: "15px" }}>{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <div className="col-sm mb-3 p-3">
                  <Table
                    hover
                    responsive
                    className="rounded mt-3 reports-custom-table"
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th>YI LU JIA 经营核算表</th>
                        <th>Owner Equity</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liabilitiesData.map((item, index) => (
                        <tr
                          key={index}
                          className={item.index === 110 ? "table-info" : ""}
                        >
                          <td style={{ padding: "15px" }}>{item.index}</td>
                          <td style={{ padding: "15px" }}>
                            {item.description}
                          </td>
                          <td style={{ padding: "15px" }}>{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              <div className="w-100 d-flex align-items-center">
                <span className="fs-3 fw-bold">Account of Receivable</span>
                <hr className="flex-grow-1 mx-3" />
              </div>
              <div className="row p-2">
                <div className="col-sm mb-3 p-3">
                  {/* <span>ASSETS</span> */}
                  <Table
                    hover
                    responsive
                    className="rounded mt-3 reports-custom-table"
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th>编号</th>
                        <th>下属工厂往来余额</th>
                        <th>预付货款/Advance Payment</th>
                        <th>余额/Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountReceivable.map((item, index) => (
                        <tr
                          key={index}
                          className={item.index === 115 ? "table-info" : ""}
                        >
                          <td style={{ padding: "15px" }}>{item.index}</td>
                          <td style={{ padding: "15px" }}>
                            {item.description}
                          </td>
                          <td style={{ padding: "15px" }}>{item.total}</td>
                          <td style={{ padding: "15px" }}>
                            {item.balance}
                          </td>{" "}
                          {/* Add this line */}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              <div className="w-100 d-flex align-items-center">
                <span className="fs-3 fw-bold">Other Payable</span>
                <hr className="flex-grow-1 mx-3" />
              </div>
              <div className="row p-2">
                <div className="col-sm mb-3 p-3">
                  {/* <span>ASSETS</span> */}
                  <Table
                    hover
                    responsive
                    className="rounded mt-3 reports-custom-table"
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th>编号</th>
                        <th>下属工厂往来余额</th>
                        <th>预付货款/Advance Payment</th>
                        <th>余额/Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountReceivable.map((item, index) => (
                        <tr
                          key={index}
                          className={item.index === 115 ? "table-info" : ""}
                        >
                          <td style={{ padding: "15px" }}>{item.index}</td>
                          <td style={{ padding: "15px" }}>
                            {item.description}
                          </td>
                          <td style={{ padding: "15px" }}>{item.total}</td>
                          <td style={{ padding: "15px" }}>
                            {item.balance}
                          </td>{" "}
                          {/* Add this line */}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              <div className="w-100 d-flex align-items-center">
                <span className="fs-3 fw-bold">Fixed Assets</span>
                <hr className="flex-grow-1 mx-3" />
              </div>
              <div className="row p-2">
                <div className="col-sm mb-3 p-3">
                  {/* <span>ASSETS</span> */}
                  <Table
                    hover
                    responsive
                    className="rounded mt-3 reports-custom-table"
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th>编号</th>
                        <th>固定资产明细 Fixed Assets</th>
                        <th>原值 ORIGINAL</th>
                        <th>折旧 DEPRI</th>
                        <th>净值 REMAINING</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fixedAssets.map((item, index) => (
                        <tr
                          key={index}
                          className={item.index === 115 ? "table-info" : ""}
                        >
                          <td style={{ padding: "15px" }}>{item.index}</td>
                          <td style={{ padding: "15px" }}>
                            {item.description}
                          </td>
                          <td style={{ padding: "15px" }}>{item.original}</td>
                          <td style={{ padding: "15px" }}>
                            {item.depriciation}
                          </td>
                          <td style={{ padding: "15px" }}>{item.remaining}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          </Tab>
          <Tab eventKey="salesIncome" title="Sales Income">
            <div className="container p-2">
              <div className="row mt-3">
                <div className="col-sm d-flex flex-row align-items-end mb-2 w-100">
                  <button className="btn btn-outline-success w-100">
                    {" "}
                    <i className="fa-solid fa-upload me-1"></i> Export
                  </button>
                  <button className="btn btn-outline-secondary w-100 mx-2">
                    <i className="fa-solid fa-download me-1"></i> Import
                  </button>
                </div>
                <div className="col-sm mb-2"></div>
                <div className="col-sm mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"

                    // onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-100 mt-5 container-fluid">
                <span className="text-dark text-start fs-2 border-bottom">
                  YI LU JIA公司销售利润报表 Sales Income Profit Report
                </span>
                <DataTable
                  columns={columns}
                  data={sampleData}
                  customStyles={customStyles}
                  pagination
                  className="dataTable"
                />
              </div>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default BossReport;
