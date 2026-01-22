import React, { useState, useEffect } from "react";

import "../../assets/css/style.css";
import RawMaterial from "./RawMaterial";
import Production from "./Production";
import Consumable from "./Consumable";
import Nav from "react-bootstrap/Nav";
import { ThreeDot } from "react-loading-indicators";
import NoAccess from "../../assets/img/NoAccess.png";
import { constant_productCategory } from "../../constants/productOptions";
import StockCategoryTab from "./StockCategoryTab";

const StockManagement = ({ authrztn }) => {
  const [key, setKey] = useState(
    constant_productCategory.length > 0
      ? constant_productCategory[0].toLowerCase().replace(/\s+/g, "")
      : ""
  );
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

  // // List of hardcoded categories and their eventKeys
  // const hardcodedTabs = [
  //   { label: "Raw Materials", eventKey: "rawmaterial" },
  //   { label: "Finish Product", eventKey: "production" },
  //   { label: "Consumables", eventKey: "consumable" },
  // ];

  // // Find categories in constant_productCategory that are not hardcoded
  // const extraTabs = constant_productCategory.filter(
  //   (cat) =>
  //     !hardcodedTabs.some(
  //       (tab) => tab.label.toLowerCase() === cat.toLowerCase()
  //     )
  // );

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
            </div>
            <br />
            <Nav variant="tabs" activeKey={key} onSelect={handleTabChange}>
              {/* <Nav.Item>
                <Nav.Link eventKey="rawmaterial">Raw Materials</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="production">Finish Products</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="consumable">Consumables</Nav.Link>
              </Nav.Item> */}
              {/* Dynamically render extra tabs */}
              {constant_productCategory.map((cat) => (
                <Nav.Item key={cat}>
                  <Nav.Link eventKey={cat.toLowerCase().replace(/\s+/g, "")}>
                    {cat}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>

            {/* {key === "rawmaterial" && <RawMaterial />}
            {key === "production" && <Production />}
            {key === "consumable" && <Consumable />} */}
            {/* Dynamically render extra tab content */}
            {constant_productCategory.map((cat) => {
              const eventKey = cat.toLowerCase().replace(/\s+/g, "");
              return (
                key === eventKey && (
                  <StockCategoryTab key={cat} category={cat} />
                )
              );
            })}
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
