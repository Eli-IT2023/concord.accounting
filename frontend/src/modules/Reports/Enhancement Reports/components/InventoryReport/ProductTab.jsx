import React, { useEffect, useState } from "react";
import BASE_URL from "../../../../../assets/global/url";
import axios from "axios";

const ProductTab = ({ productCategory, thisFromdate, thisTodate }) => {
  const [inventoryReport, setInventoryReport] = useState({
    inventory: [],
    total: {},
  });

  // Helper: formats a number to 2 decimal places
  const formatToTwoDecimal = (num) => {
    const value = num || 0;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get the inventory report summary
  const getInventoryReport = async () => {
    try {
      const baseParams = {
        startDate: thisFromdate,
        endDate: thisTodate,
      };

      const inventoryReportEndpoint = `${BASE_URL}/inventoryReport`;

      const res = await axios.get(
        `${inventoryReportEndpoint}/inventory/summary`,
        {
          params: {
            ...baseParams,
            productCategory,
          },
        }
      );

      setInventoryReport({
        inventory: res.data.inventory,
        total: res.data.total,
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getInventoryReport();
  }, [thisFromdate, productCategory]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm mb-3">
          <div className="w-100 d-flex align-items-center mt-3 mb-3">
            <h5>{productCategory} Inventory</h5>
            <hr className="flex-grow-1 mx-3" />
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="thead-light">
                <tr>
                  <th rowSpan="2">Item Code</th>
                  <th rowSpan="2">Product Name</th>
                  <th colSpan="3" className="text-center">
                    Beginning Inventory
                  </th>
                  <th colSpan="3" className="text-center">
                    Product In
                  </th>
                  <th colSpan="3" className="text-center">
                    Product Out
                  </th>
                  <th colSpan="3" className="text-center">
                    Final Inventory
                  </th>
                </tr>
                <tr>
                  <th>Quantity</th>
                  <th>Avg. Price</th>
                  <th>Amount (₱)</th>
                  <th>Quantity</th>
                  <th>Avg. Price</th>
                  <th>Amount (₱)</th>
                  <th>Quantity</th>
                  <th>Avg. Price</th>
                  <th>Amount (₱)</th>
                  <th>Quantity</th>
                  <th>Avg. Price</th>
                  <th>Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                {inventoryReport?.inventory?.map((item) =>
                  // prettier-ignore
                  <React.Fragment>
                    <tr key={item.product_id}>
                      <td>{item.productCode}</td>
                      <td>{item.productName}</td>
                      {/* Beginning Inventory */}
                      <td>{formatToTwoDecimal(item.beginningInventoryQuantity)}</td>
                      <td>{formatToTwoDecimal(item.beginningInventoryAveragePrice)}</td>
                      <td>{formatToTwoDecimal(item.beginningInventoryAmount)}</td>
                      {/* Product In */}
                      <td>{formatToTwoDecimal(item.productInQuantity)}</td>
                      <td>{formatToTwoDecimal(item.productInAveragePrice)}</td>
                      <td>{formatToTwoDecimal(item.productInAmount)}</td>
                      {/* Product Out */}
                      <td>{formatToTwoDecimal(item.productOutQuantity)}</td>
                      <td>{formatToTwoDecimal(item.productOutAveragePrice)}</td>
                      <td>{formatToTwoDecimal(item.productOutAmount)}</td>
                      {/* Final Inventory */}
                      <td>{formatToTwoDecimal(item.finalInventoryQuantity)}</td>
                      <td>{formatToTwoDecimal(item.finalInventoryAveragePrice)}</td>
                      <td>{formatToTwoDecimal(item.finalInventoryAmount)}</td>
                    </tr>
                  </React.Fragment>
                )}

                {/* Footer: Total */}
                {/* prettier-ignore */}
                <React.Fragment>
                  <tr className="font-weight-bold table-primary">
                    <td colSpan="2" className="text-right fw-bold">
                      Total:
                    </td>
                    {/* Total of Beginning Inventory */}
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.beginningInventoryQuantity)}</td>
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.beginningInventoryAveragePrice)}</td>
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.beginningInventoryAmount)}</td>
                    {/* Total of Product In */}
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.productInQuantity)}</td>
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.productInAveragePrice)}</td>
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.productInAmount)}</td>
                    {/* Total of Product Out */}
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.productOutQuantity)}</td>
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.productOutAveragePrice)}</td>
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.productOutAmount)}</td>
                    {/* Total of Final Inventory */}
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.finalInventoryQuantity)}</td>
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.finalInventoryAveragePrice)}</td>
                    <td className="text-success fw-bold">{formatToTwoDecimal(inventoryReport?.total?.finalInventoryAmount)}</td>
                  </tr>
                </React.Fragment>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTab;
