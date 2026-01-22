import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../assets/global/url";
import Select from "react-select";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import "../../../../assets/css/style.css";
import DatePicker from "react-datepicker";
import NoAccess from "../../../../assets/img/NoAccess.png";
import ProductTab from "./InventoryReport/ProductTab";
import { constant_productCategory } from "../../../../constants/productOptions";

const InventoryReport1 = () => {
  const navigate = useNavigate();
  const { module, id } = useParams();
  const [activeTab, setActiveTab] = useState("Raw Materials");

  // For Cutoff filter
  const [thisFromdate, setThisFromdate] = useState("");
  const [thisTodate, setThisTodate] = useState("");
  const [cutoffList, setCutoffList] = useState([]);
  const [selectedCutoff_id, setSelectedCutoff_id] = useState("");

  // For Overview
  const [overview, setOverview] = useState({});
  const [showTable, setShowTable] = useState(false);
  const toggleTable = () => {
    setShowTable(!showTable);
  };

  const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));

  // Helper: formats a number to 2 decimal places
  const formatToTwoDecimal = (num) => {
    const value = num || 0;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Helper: calculate the growth index
  const getGrowthIndex = ({ current = 0, previous = 0 }) => {
    const normalizedCurrent = parseNumber(current);
    const normalizedPrevious = parseNumber(previous);

    if (!normalizedPrevious) return 0;

    return (
      ((normalizedCurrent - normalizedPrevious) / normalizedPrevious) * 100
    );
  };

  // Get inventory report overview
  const getOverview = async (startDate, endDate) => {
    try {
      const res = await axios.get(`${BASE_URL}/inventoryReport/overview`, {
        params: {
          startDate,
          endDate,
        },
      });

      setOverview(res.data.overview);
    } catch (error) {
      console.error(error);
    }
  };

  // Get the default cutoff
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

        getOverview(cutoff_fromdate, cutoff_todate);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // Handle cutoff change
  const handleCutoffChange = (value) => {
    setSelectedCutoff_id(value);
    const cutoff_fromdate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).from ||
      "";
    const cutoff_todate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).to || "";

    setThisFromdate(cutoff_fromdate);
    setThisTodate(cutoff_todate);

    getOverview(cutoff_fromdate, cutoff_todate);
  };

  // For product tab props
  const dateRange = {
    thisFromdate,
    thisTodate,
  };

  useEffect(() => {
    getCutoff();
  }, []);

  return (
    <div className="h-100 w-100 bg-white p-2">
      <>
        <div className="w-100 d-flex flex-row justify-content-between">
          <div className="d-flex flex-column title-custom">
            <span className="fs-3 text-uppercase">
              {module && id && module === "earnings" && (
                <Link
                  to={`/accounting/view-earnings/${id}`}
                  className="text-dark mx-2"
                >
                  <i class="fa-solid fa-arrow-left"></i>
                </Link>
              )}
              Inventory Report
            </span>
          </div>
        </div>

        {/* Cutoff filter */}
        <div className="w-100 row mx-auto mt-2">
          <h6>Accounting Period</h6>
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
            <DatePicker
              selected={thisFromdate}
              dateFormat="MMM/dd/yyyy"
              className="form-control"
              readOnly
            />
          </div>
          <div className="col-sm mb-2">
            <span>To</span>
            <DatePicker
              selected={thisTodate}
              dateFormat="MMM/dd/yyyy"
              className="form-control"
              readOnly
            />
          </div>
          <div className="col-sm"></div>
          <div className="col-sm"></div>
        </div>

        {/* Overview */}
        <div className="w-100 container-fluid mt-2">
          <div className="d-flex justify-content-between align-items-center">
            <h5>Overview</h5>
            <button className="btn btn-primary" onClick={toggleTable}>
              {showTable ? "Hide Overview" : "Show Overview"}
            </button>
          </div>

          <CSSTransition
            in={showTable}
            timeout={300}
            classNames="slide"
            unmountOnExit
          >
            <div className="table-responsive mt-3">
              <table className="table table-bordered table-striped">
                <thead className="thead-light">
                  <tr>
                    <th rowSpan="2">Inventory Type</th>
                    <th colSpan="3" className="text-center">
                      Final Inventory
                    </th>
                    <th colSpan="3" className="text-center">
                      Comparison to Previous Period
                    </th>
                    <th colSpan="2" className="text-center">
                      Final Inventory Growth Index
                    </th>
                  </tr>
                  <tr>
                    <th>Quantity</th>
                    <th>Avg. Price</th>
                    <th>Amount (₱)</th>
                    <th>Quantity</th>
                    <th>Avg. Price</th>
                    <th>Amount (₱)</th>
                    <th>Quantity (%)</th>
                    <th>Amount (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(overview).map(([category, value], index) => {
                    // prettier-ignore
                    const inventoryTotals = {
                      beginningInventoryQuantity: formatToTwoDecimal(value.beginningInventoryQuantity),
                      beginningInventoryAveragePrice: formatToTwoDecimal(value.beginningInventoryAveragePrice),
                      beginningInventoryAmount: formatToTwoDecimal(value.beginningInventoryAmount),
                      finalInventoryQuantity: formatToTwoDecimal(value.finalInventoryQuantity),
                      finalInventoryAveragePrice: formatToTwoDecimal(value.finalInventoryAveragePrice),
                      finalInventoryAmount: formatToTwoDecimal(value.finalInventoryAmount),
                    }

                    const quantityGrowthIndex = getGrowthIndex({
                      current: inventoryTotals.finalInventoryQuantity,
                      previous: inventoryTotals.beginningInventoryQuantity,
                    });

                    const amountGrowthIndex = getGrowthIndex({
                      current: inventoryTotals.finalInventoryAmount,
                      previous: inventoryTotals.beginningInventoryAmount,
                    });

                    return (
                      // prettier-ignore
                      <React.Fragment>
                        <tr key={index}>
                          <td>{category} Inventory</td>
                          {/* For Current Period */}
                          <td>{inventoryTotals.finalInventoryQuantity}</td>
                          <td>{inventoryTotals.finalInventoryAveragePrice}</td>
                          <td>{inventoryTotals.finalInventoryAmount}</td>
                          {/* Comparison for Previous Period */}
                          <td>{inventoryTotals.beginningInventoryQuantity}</td>
                          <td>{inventoryTotals.beginningInventoryAveragePrice}</td>
                          <td>{inventoryTotals.beginningInventoryAmount}</td>
                          {/* For Growth Index */}
                          <td>{formatToTwoDecimal(quantityGrowthIndex)}%</td>
                          <td>{formatToTwoDecimal(amountGrowthIndex)}%</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CSSTransition>
        </div>

        {/* Product Category's Tab */}
        <div className="container-fluid mt-2">
          <Tabs
            transition={false}
            mountOnEnter
            unmountOnExit={false}
            activeKey={activeTab}
            defaultActiveKey="Raw Materials"
            onSelect={(activeTab) => {
              setActiveTab(activeTab);
            }}
            id="product-tab"
            className="mb-3"
          >
            {constant_productCategory.map((category) => (
              <Tab eventKey={category} title={category}>
                <ProductTab productCategory={category} {...dateRange} />
              </Tab>
            ))}
          </Tabs>
        </div>
      </>
    </div>
  );
};

export default InventoryReport1;
