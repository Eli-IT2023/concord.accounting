import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../assets/css/style.css";
import RawMaterial from "./RawMaterial";
import Production from "./Production";
import Consumable from "./Consumable";
import Nav from "react-bootstrap/Nav";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";

const StockManagement = ({ authrztn }) => {
  const [key, setKey] = useState("rawmaterial");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleTabChange = (selectedKey) => {
    setIsLoading(true);
    setKey(selectedKey);
  };

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
      ) : authrztn.includes("StockManagement-View") ? (
        <>
          <div className="my-container">
            <div className="w-100 p-2 d-flex flex-row justify-content-between">
              <div className="d-flex flex-column title-custom">
                <span className="fs-3">STOCK MANAGEMENT</span>
              </div>
              <div>
                <Link
                  to="/inventory/stock-return-list"
                  className="btn btn-primary"
                >
                  Return List
                </Link>
              </div>
            </div>
            <br />
            <Nav variant="tabs" activeKey={key} onSelect={handleTabChange}>
              <Nav.Item>
                <Nav.Link eventKey="rawmaterial">Raw Material</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="production">Finish Product</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="consumable">Consumable</Nav.Link>
              </Nav.Item>
            </Nav>

            {key === "rawmaterial" && <RawMaterial />}
            {key === "production" && <Production />}
            {key === "consumable" && <Consumable />}
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

export default StockManagement;
