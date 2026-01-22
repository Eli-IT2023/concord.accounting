import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { customStyles } from "../../../styles/table-style";
import BASE_URL from "../../../../assets/global/url";
import DataTable from "react-data-table-component";
import Nav from "react-bootstrap/Nav";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";

function NewRawMaterialUpdate() {
  const [key, setKey] = useState("rawMaterialStock");

  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const productId = queryParams.get("productId");
  const warehouseId = queryParams.get("warehouseId");

  const product = useServerPagination("about:blank", 10);
  const [productInfo] = product.data;

  // Helper: formats a number to 2 decimal places
  const formatToTwoDecimal = (num) => {
    const value = num || 0;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getProduct = () => {
    product.updateApiUrl(
      `${BASE_URL}/stockManagement/products/${productId}/warehouses/${warehouseId}`
    );
  };

  // DataTable columns mapping
  const productColumns = [
    {
      name: "ID",
      selector: (row) => row.product_code,
    },
    {
      name: "Product Name",
      selector: (row) => (
        <div className="text-center" title={row.product_name}>
          {row.product_name}
        </div>
      ),
      width: "24rem",
    },
    {
      name: "Warehouse Name",
      selector: (row) => row.warehouse_name,
    },
    {
      name: "Quantity",
      selector: (row) => formatToTwoDecimal(row.stock_quantity) || "N/A",
    },
    {
      name: "Average Price",
      selector: (row) => formatToTwoDecimal(row.average_price) || "N/A",
    },
  ];

  useEffect(() => {
    getProduct();
  }, []);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <span className="fs-3">
        <Link to="/inventory/stock-management" className="text-dark">
          <i class="fa-solid fa-arrow-left"></i>
        </Link>
      </span>
      <div className="container border rounded shadow-sm p-5 mb-1">
        <div className="row">
          <div className="col-md-3">
            <label className="text-muted d-block">Product Name</label>
            <span>{productInfo?.product_name}</span>
          </div>
          <div className="col-md-3">
            <label className="text-muted d-block">Product Code</label>
            <span>{productInfo?.product_code}</span>
          </div>
          <div className="col-md-3">
            <label className="text-muted d-block">Product Category</label>
            <span>{productInfo?.product_category}</span>
          </div>
          <div className="col-md-3">
            <label className="text-muted d-block">UOM</label>
            <span>{productInfo?.unit_of_measure}</span>
          </div>
        </div>
        <hr />
        <div className="row">
          <div className="col-md-2">
            <label className="text-muted d-block">Average Price</label>
            <span>₱ {formatToTwoDecimal(productInfo?.average_price)}</span>
          </div>
          <div className="col-md-2">
            <label className="text-muted d-block">Average Total Value</label>
            <span>₱ {formatToTwoDecimal(productInfo?.total_price)}</span>
          </div>
          <div className="col-md-2">
            <label className="text-muted d-block">Quantity</label>
            <span>{formatToTwoDecimal(productInfo?.stock_quantity)}</span>
          </div>
          <div className="col-md-2">
            <label className="text-muted d-block">Status</label>
            <span
              className={
                productInfo?.stock_quantity > 0 ? "text-success" : "text-danger"
              }
            >
              {productInfo?.stock_quantity > 0 ? "On stock" : "No Stock"}
            </span>
          </div>
        </div>
      </div>

      <Nav variant="tabs" activeKey={key} onSelect={(k) => setKey(k)}>
        <Nav.Item>
          <Nav.Link eventKey="rawMaterialStock">Stocks Transaction</Nav.Link>
        </Nav.Item>
      </Nav>

      {key === "rawMaterialStock" && (
        <>
          <DataTable
            columns={productColumns}
            data={product.data}
            customStyles={customStyles}
          />
          <PaginationControls {...product} />
        </>
      )}
    </div>
  );
}

export default NewRawMaterialUpdate;
