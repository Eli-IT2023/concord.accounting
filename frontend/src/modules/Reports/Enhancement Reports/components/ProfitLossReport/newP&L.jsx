import React, { useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import "../../../../../assets/css/style.css";
import ExchangePL from "./tabs/ExhangeP&L";
import ForecastedPL from "./tabs/ForecastedP&L";

const Profit_Loss = ({ authrztn }) => {
  // // Set default dates - current month
  // const currentDate = new Date();
  // const firstDayOfMonth = new Date(
  //   currentDate.getFullYear(),
  //   currentDate.getMonth(),
  //   1
  // );
  // const lastDayOfMonth = new Date(
  //   currentDate.getFullYear(),
  //   currentDate.getMonth() + 1
  // );

  // const [thisFromdate, setThisFromdate] = useState(
  //   firstDayOfMonth.toISOString().split("T")[0]
  // );
  // const [thisTodate, setThisTodate] = useState(
  //   lastDayOfMonth.toISOString().split("T")[0]
  // );
  const [activeTab, setActiveTab] = useState("forecasted");

  // const handleDateRangeChange = (startDate, endDate) => {
  //   setThisFromdate(startDate);
  //   setThisTodate(endDate);
  // };

  return (
    <div className="h-100 w-100 bg-white custom-container">
      <div className="w-100 p-2 d-flex flex-row justify-content-between">
        <div className="d-flex flex-column title-custom">
          <span className="fs-3 text-uppercase">Currency Profit & Loss</span>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="forecasted" title="Forecasted P&L">
          <ForecastedPL authrztn={authrztn} />
        </Tab>
        <Tab eventKey="exchange" title="Exchange P&L">
          <ExchangePL authrztn={authrztn} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default Profit_Loss;
