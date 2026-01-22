import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../assets/global/url";
import Select from "react-select";
import { Link } from "react-router-dom";

const BalanceSheet = () => {
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

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="container">
        <div className="row p-2">
          <div className="col-sm mb-2 p-3">
            <div className="row">
              <div className="col-12 col-md-8 mb-2 title-custom d-flex align-items-center">
                <span className="fs-3">FINAL SHEET (资产负债表)</span>
              </div>
              <div className="col-12 col-md-2 mb-2">
                <button className="w-100 btn btn-dark">₱0</button>
              </div>
            </div>
          </div>
          <div className="col-sm mb-2 p-3">
            <div className="row">
              <div className="col-12 col-md-3 mb-2">
                <button className="w-100 btn btn-success">POST RESULT</button>
              </div>
              <div className="col-12 col-md-8 mb-2 d-flex align-items-center justify-content-center">
                <div>
                  <span>
                    <span className="text-primary">500,000.00</span>
                    <span className="text-secondary">+</span>
                    <span className="text-danger">
                      (1500,000.00 +{" "}
                      <span className="text-success">350,000.00</span>)
                    </span>
                  </span>
                  <br />
                  <span>
                    <span className="text-primary">ASSET (资产)</span>
                    <span className="text-secondary"></span>
                    <span className="text-danger">
                      <span className="mx-2">LIABILITIES</span>
                      <span className="text-secondary">AND</span>
                      <span className="text-success mx-2">OWNER'S EQUITY</span>
                      <span>(负债和所有者权益)</span>
                    </span>
                  </span>
                </div>
                {/* <div className="d-flex flex-column">
                  <h5 className="mb-0 text-primary fw-bold">500,000.00+</h5>
                  <h6 className="mb-0 text-primary">ASSET (资产)</h6>
                </div> */}
              </div>
            </div>
          </div>
        </div>
        <div className="row p-2">
          <div className="col-sm mb-3 p-3">
            <span>ASSETS</span>
            <Table
              hover
              responsive
              className="rounded mt-3 reports-custom-table"
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>行次</th>
                  <th>Current Assets (流动资产)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilitiesData.map((item, index) => (
                  <tr
                    key={index}
                    className={item.index === 110 ? "table-info" : ""}
                  >
                    <td style={{ padding: "15px" }}>{item.index}</td>
                    <td style={{ padding: "15px" }}>{item.description}</td>
                    <td style={{ padding: "15px" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="col-sm mb-3 p-3">
            <span>LIABILITIES AND OWNER'S EQUITY (负债和所有者权力)</span>
            <Table
              hover
              responsive
              className="rounded mt-3 reports-custom-table"
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>行次</th>
                  <th>Current Liabilities (流动负债)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilitiesData.map((item, index) => (
                  <tr
                    key={index}
                    className={item.index === 110 ? "table-info" : ""}
                  >
                    <td style={{ padding: "15px" }}>{item.index}</td>
                    <td style={{ padding: "15px" }}>{item.description}</td>
                    <td style={{ padding: "15px" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
        <div className="row p-2">
          <div className="col-sm mb-3 p-3">
            <span>LONG TERM INVESTMENT (长期投资)</span>
            <Table
              hover
              responsive
              className="rounded mt-3 reports-custom-table"
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>行次</th>
                  <th>Long Term Investment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilitiesData.map((item, index) => (
                  <tr
                    key={index}
                    className={item.index === 110 ? "table-info" : ""}
                  >
                    <td style={{ padding: "15px" }}>{item.index}</td>
                    <td style={{ padding: "15px" }}>{item.description}</td>
                    <td style={{ padding: "15px" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="col-sm mb-3 p-3">
            <span>LONG TERM LIABILITIES (长期负债)</span>
            <Table
              hover
              responsive
              className="rounded mt-3 reports-custom-table"
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>行次</th>
                  <th>Long Term Liabilites</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilitiesData.map((item, index) => (
                  <tr
                    key={index}
                    className={item.index === 110 ? "table-info" : ""}
                  >
                    <td style={{ padding: "15px" }}>{item.index}</td>
                    <td style={{ padding: "15px" }}>{item.description}</td>
                    <td style={{ padding: "15px" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
        <div className="row p-2">
          <div className="col-sm mb-3 p-3">
            <span>FIXED ASSET (固定资产)</span>
            <Table
              hover
              responsive
              className="rounded mt-3 reports-custom-table"
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>行次</th>
                  <th>Fixed Asset</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilitiesData.map((item, index) => (
                  <tr
                    key={index}
                    className={item.index === 110 ? "table-info" : ""}
                  >
                    <td style={{ padding: "15px" }}>{item.index}</td>
                    <td style={{ padding: "15px" }}>{item.description}</td>
                    <td style={{ padding: "15px" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="col-sm mb-3 p-3">
            <span>DEFFERED TAX (递延税项)</span>
            <Table
              hover
              responsive
              className="rounded mt-3 reports-custom-table"
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>行次</th>
                  <th>Deffered Tax</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilitiesData.map((item, index) => (
                  <tr
                    key={index}
                    className={item.index === 110 ? "table-info" : ""}
                  >
                    <td style={{ padding: "15px" }}>{item.index}</td>
                    <td style={{ padding: "15px" }}>{item.description}</td>
                    <td style={{ padding: "15px" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
        <div className="row p-2">
          <div className="col-sm mb-3 p-3">
            <span>INTANGIBLE FIXED ASSET (无形资产及其他资产)</span>
            <Table
              hover
              responsive
              className="rounded mt-3 reports-custom-table"
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>行次</th>
                  <th>Intangible Fixed Asset</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilitiesData.map((item, index) => (
                  <tr
                    key={index}
                    className={item.index === 110 ? "table-info" : ""}
                  >
                    <td style={{ padding: "15px" }}>{item.index}</td>
                    <td style={{ padding: "15px" }}>{item.description}</td>
                    <td style={{ padding: "15px" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="col-sm mb-3 p-3">
            <span>OWNERS EQUITY (所有者权益（或股东权益）)</span>
            <Table
              hover
              responsive
              className="rounded mt-3 reports-custom-table"
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>行次</th>
                  <th>Owners Equity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilitiesData.map((item, index) => (
                  <tr
                    key={index}
                    className={item.index === 110 ? "table-info" : ""}
                  >
                    <td style={{ padding: "15px" }}>{item.index}</td>
                    <td style={{ padding: "15px" }}>{item.description}</td>
                    <td style={{ padding: "15px" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
        <div className="row p-2">
          <div className="col-sm mb-3 p-3">
            <span>DEFFERED TAX (递延税项)</span>
            <Table
              hover
              responsive
              className="rounded mt-3 reports-custom-table"
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>行次</th>
                  <th>Deffered Tax (递延税款借项)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilitiesData.map((item, index) => (
                  <tr
                    key={index}
                    className={item.index === 110 ? "table-info" : ""}
                  >
                    <td style={{ padding: "15px" }}>{item.index}</td>
                    <td style={{ padding: "15px" }}>{item.description}</td>
                    <td style={{ padding: "15px" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="col-sm mb-3 p-3">
            <span>Reserve</span>
            <Table
              hover
              responsive
              className="rounded mt-3 reports-custom-table"
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>行次</th>
                  <th>Reserve</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilitiesData.map((item, index) => (
                  <tr
                    key={index}
                    className={item.index === 110 ? "table-info" : ""}
                  >
                    <td style={{ padding: "15px" }}>{item.index}</td>
                    <td style={{ padding: "15px" }}>{item.description}</td>
                    <td style={{ padding: "15px" }}>{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
        <div className="row p-2 mx-auto">
          <div
            className="col-sm p-3 rounded text-white d-flex flex-row justify-content-between"
            style={{ background: "#0a9cbc" }}
          >
            <div>
              <span>122</span>
              <span className="mx-3">
                Total of Liabilities and Owner's Equity(负债和所有者权力合计)
              </span>
            </div>
            <div>
              <span className="peso">0.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
