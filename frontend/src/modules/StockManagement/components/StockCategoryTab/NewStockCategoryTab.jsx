import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../styles/table-style";
import BASE_URL from "../../../../assets/global/url";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";

function NewStockCategoryTab({ category }) {
  const navigate = useNavigate();
  // For search filter
  const debounceTimer = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");

  // For warehouse
  const selectedWarehouse = useRef("");
  const warehouseOptions = useRef([]);

  // For widgets
  const [widgets, setWidgets] = useState({
    totalQuantity: 0,
    overallPrice: 0,
  });

  // For fetchings
  const stockManagementEndpoint = `${BASE_URL}/stockManagement`;
  const productsPagination = useServerPagination("about:blank", 10);

  // Helper: formats a number to 2 decimal places
  const formatToTwoDecimal = (num) => {
    const value = num || 0;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get the stock management widgets
  const getWidgets = async () => {
    try {
      const res = await axios.get(`${stockManagementEndpoint}/widgets`, {
        params: {
          productCategory: category,
        },
      });

      setWidgets((prev) => ({
        ...prev,
        ...res.data,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  // Get the stock management product's table
  const getProducts = () => {
    productsPagination.updateApiUrl(
      `${stockManagementEndpoint}/products/category-summary`
    );
    productsPagination.updateParams({
      productCategory: category,
      warehouseId: selectedWarehouse.current,
    });
  };

  // Fetch warehouse options
  const fetchWarehouse = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/warehouse/getWarehouse`);
      warehouseOptions.current = res.data;
    } catch (error) {
      console.log(error);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      productsPagination.updateApiUrl(
        `${stockManagementEndpoint}/products/category-summary/search`
      );
      productsPagination.updateParams({
        productCategory: category,
        warehouseId: selectedWarehouse.current,
        filterColumn,
        searchText: e.target.value,
      });
    }, 500);
  };

  // Handle warehouse change
  const handleWarehouseChange = (event) => {
    selectedWarehouse.current = event.target.value;
    getProducts();
  };

  // Handle row click
  const handleRowClicked = (row) => {
    navigate(
      `/inventory/stockMangement/rawMaterialUpdate?productId=${row.product_id}&warehouseId=${row.warehouse_id}`
    );
  };

  // Fix filterColumn values to match backend
  const searchFilters = [
    { value: "all", label: "All" },
    { value: "product_code", label: "Product Code" },
    { value: "product_name", label: "Product Name" },
    { value: "unit_of_measure", label: "UOM" },
    { value: "stock_quantity", label: "Stock Quantity" },
    { value: "average_price", label: "Average Price" },
    { value: "total_price", label: "Total Price" },
  ];

  // DataTable columns mapping
  const productColumns = [
    {
      name: "Warehouse",
      selector: (row) => row.warehouse_name,
    },
    {
      name: "Code",
      selector: (row) => row.product_code,
    },
    {
      name: "Name",
      selector: (row) => (
        <div className="text-center" title={row.product_name}>
          {row.product_name}
        </div>
      ),
      width: "24rem",
    },
    {
      name: "Category",
      selector: (row) => row.product_category,
    },
    {
      name: "UOM",
      selector: (row) => row.unit_of_measure,
    },
    {
      name: "Threshold",
      selector: (row) => row.threshold,
    },
    {
      name: "Stock Quantity",
      selector: (row) => formatToTwoDecimal(row.stock_quantity) || "N/A",
    },
    {
      name: "Average Price",
      selector: (row) => formatToTwoDecimal(row.average_price) || "N/A",
    },
    {
      name: "Total Price",
      selector: (row) => formatToTwoDecimal(row.total_price) || "N/A",
    },
  ];

  useEffect(() => {
    getWidgets();
    getProducts();
    fetchWarehouse();
  }, []);

  // Reset searchTerm when filterColumn changes
  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  return (
    <div className="h-100 w-100 bg-white custom-container">
      <div className="row">
        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title d-flex align-items-center justify-content-center">
                <i className="bx bx-package me-1 h-100"></i>
                Total Quantity
              </h5>
              <p
                className="card-text text-success amount"
                title={formatToTwoDecimal(widgets.totalQuantity)}
                style={{ cursor: "default" }}
              >
                {formatToTwoDecimal(widgets.totalQuantity)}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title d-flex align-items-center justify-content-center">
                <i className="bx bx-money me-1 h-100"></i>
                Overall Price
              </h5>
              <p
                className="card-text text-success amount"
                title={formatToTwoDecimal(widgets.overallPrice)}
                style={{ cursor: "default" }}
              >
                ₱{formatToTwoDecimal(widgets.overallPrice)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-100 row mx-0 mt-3">
        <div className="col-sm mb-2">
          <select
            className="form-select"
            onChange={handleWarehouseChange}
            value={selectedWarehouse.current}
          >
            <option value="">All Warehouse</option>
            {warehouseOptions.current.map((warehouse, index) => (
              <option key={index} value={warehouse.warehouse_id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-sm text-end mb-2"></div>
      </div>

      <div className="row mx-0 mt-2">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button
            type="button"
            className="btn btn-outline-secondary dropdown-toggle-split"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fa-solid fa-sliders"></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            {searchFilters.map(({ value, label }) => (
              <li key={value}>
                <button
                  className={`dropdown-item ${
                    filterColumn === value ? "active" : ""
                  }`}
                  onClick={() => setFilterColumn(value)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* )} */}
      </div>
      <div className="w-100 mt-3 container-fluid">
        <div className="data-table-cell-width">
          <DataTable
            columns={productColumns}
            data={productsPagination.data}
            customStyles={customStyles}
            onRowClicked={handleRowClicked}
          />
          <PaginationControls {...productsPagination} />
        </div>
      </div>
    </div>
  );
}

export default NewStockCategoryTab;
