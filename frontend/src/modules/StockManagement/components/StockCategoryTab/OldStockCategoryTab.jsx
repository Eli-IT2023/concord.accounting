import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../styles/table-style";
import BASE_URL from "../../../../assets/global/url";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";

function OldStockCategoryTab({ category }) {
  const navigate = useNavigate();
  const [inboundData, setInboundData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [totalQty, setTotalQty] = useState(0);
  const [overAllPrice, setOverAllPrice] = useState(0);
  const [userLoggedID, setUserLoggedID] = useState("");
  const selectedWarehouse = useRef("");
  const warehouseOptions = useRef([]);

  // Decode user token
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (typeof token === "string") {
      const decoded = jwtDecode(token);
      setUserLoggedID(decoded.id);
    }
  }, []);

  // Pagination hook
  const pagination = useServerPagination("about:blank", 10);

  // Fetch warehouse options
  const fetchWarehouse = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/warehouse/getWarehouse`);
      warehouseOptions.current = res.data;
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchWarehouse();
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Reload table with search/filter
  const reloadTable = () => {
    if (searchTerm || filterColumn !== "all" || selectedWarehouse.current) {
      pagination.updateApiUrl(
        `${BASE_URL}/stockManagement/getStockManagementFetchModule-search`
      );
      pagination.updateParams({
        warehouseId: selectedWarehouse.current,
        filterColumn: filterColumn === "all" ? "" : filterColumn,
        searchText: searchTerm,
        category,
      });
    } else {
      pagination.updateApiUrl(
        `${BASE_URL}/stockManagement/getStockManagementFetchModule`
      );
      pagination.updateParams({
        category,
      });
    }
  };

  // Trigger reload on searchTerm or filterColumn change
  useEffect(() => {
    reloadTable();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterColumn, selectedWarehouse.current, category]);

  // Reset searchTerm when filterColumn changes
  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  // Handle warehouse change
  const handleWarehouseChange = (event) => {
    selectedWarehouse.current = event.target.value;
    reloadTable();
  };

  // Update inboundData when pagination data changes
  // useEffect(() => {
  //   const sortedStockList = pagination.data?.data?.sort(
  //     (a, b) => b.stock_management_id - a.stock_management_id
  //   );
  //   setInboundData(sortedStockList || []);
  // }, [pagination.data]);

  // Fetch summary widgets
  const fetchStockManagementWidgets = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/stockManagement/getStockManagementWidgets`,
        {
          params: { category },
        }
      );
      const totalQty = res.data.reduce(
        (sum, data) => sum + (data.total_stock || 0),
        0
      );
      const overAllPrice = res.data.reduce(
        (sum, data) => sum + (data.total_stock * data.average_price || 0),
        0
      );
      setTotalQty(totalQty);
      setOverAllPrice(overAllPrice);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStockManagementWidgets();
    reloadTable();

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Fix filterColumn values to match backend
  const filterOptions = [
    { value: "all", label: "All" },
    { value: "product_code", label: "Product Code" },
    { value: "product_name", label: "Product Name" },
    { value: "unit_of_measure", label: "UOM" },
    { value: "total_stock", label: "Stock Quantity" },
    { value: "average_price", label: "Average Price" },
    { value: "total_price", label: "Total Price" },
  ];

  // DataTable columns mapping
  const columns = [
    {
      name: "Warehouse",
      selector: (row) => row.warehouseName,
    },
    {
      name: "Code",
      selector: (row) => row.productCode,
    },
    {
      name: "Name",
      selector: (row) => (
        <div className="text-center" title={row.productName}>
          {row.productName}
        </div>
      ),
      width: "24rem",
    },
    {
      name: "Category",
      selector: (row) => row.productCategory,
    },
    {
      name: "UOM",
      selector: (row) => row.uom,
    },
    {
      name: "Threshold",
      selector: (row) => row.threshold,
    },
    {
      name: "Stock Quantity",
      selector: (row) =>
        row.stock?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "N/A",
    },
    {
      name: "Average Price",
      selector: (row) =>
        row.averagePrice?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "N/A",
    },
    {
      name: "Total Price",
      selector: (row) =>
        row.totalPrice?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "N/A",
    },
  ];

  // Map backend data to DataTable row
  const userData = pagination.data.map((data, i) => ({
    key: i,
    warehouseId: data.warehouse_id,
    productId: data.product_id,
    warehouseName: data.warehouse?.name,
    productCode: data.product_list?.product_code,
    productName: data.product_list?.product_name,
    productCategory: data.product_list?.product_category,
    uom: data.product_list?.unit_of_measure,
    threshold: data.product_list?.threshold,
    stock: data.total_stock,
    averagePrice: data.average_price,
    totalPrice: data.totalPrice,
  }));

  // Handle row click
  const handleRowClicked = (row) => {
    // if (userLoggedID === "11111111-1111-1111-1111-111111111111") {
    navigate(
      `/inventory/stockMangement/rawMaterialUpdate?productId=${row.productId}&warehouseId=${row.warehouseId}`
    );
    // }
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
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
                title={totalQty?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                style={{ cursor: "default" }}
              >
                {totalQty?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
                title={overAllPrice?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                style={{ cursor: "default" }}
              >
                ₱
                {overAllPrice?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
        <div className="col-sm text-end mb-2">
          {/* <button
            className="btn btn-secondary"
            onClick={() => setSearchTerm("")}
          >
            Clear Filter
          </button> */}
        </div>
      </div>

      <div className="row mx-0 mt-2">
        {/* {userLoggedID === "11111111-1111-1111-1111-111111111111" && ( */}
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
            {filterOptions.map(({ value, label }) => (
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
            columns={columns}
            data={userData}
            customStyles={customStyles}
            onRowClicked={handleRowClicked}
          />
          <PaginationControls {...pagination} />
        </div>
      </div>
    </div>
  );
}

export default OldStockCategoryTab;
