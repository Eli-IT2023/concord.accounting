import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { customStyles } from "../styles/table-style";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
function RawMaterial() {
  const navigate = useNavigate();
  const [inboundData, setInboundData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  // const [warehouseOptions, setWarehouseOptions] = useState([]);
  // const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // State to hold the search term
  const [filterColumn, setFilterColumn] = useState("all");
  const warehouseOptions = useRef([]);
  const selectedWarehouse = useRef("");

  const [userLoggedID, setUserLoggedID] = useState([]);

  const decodeToken = () => {
    var token = localStorage.getItem("accessToken");
    if (typeof token === "string") {
      var decoded = jwtDecode(token);
      setUserLoggedID(decoded.id);
    }
  };
  useEffect(() => {
    decodeToken();
  }, []);

  const pagination = useServerPagination(
    BASE_URL + "/stockManagement/getStockManagement",
    10
  );

  const reloadTable = (id = null, searchText) => {
    pagination.updateParams({
      id,
      category: "Raw Materials",
      searchText,
      filterColumn,
    });
    // axios
    //   .get(BASE_URL + "/stockManagement/getStockManagement", {
    //     params: {
    //       id,
    //       category: "Raw Materials",
    //       searchText,
    //       filterColumn,
    //     },
    //   })
    //   .then((res) => {
    //     const sortedStockList = res.data.sort(
    //       (a, b) => b.stock_management_id - a.stock_management_id
    //     );
    //     setInboundData(sortedStockList);
    //     console.log(res.data);
    //   })
    //   .catch((err) => console.log(err));
  };

  const fetchWarehouse = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/warehouse/getWarehouse`);
      console.log(res.data);
      warehouseOptions.current = res.data;
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const sortedStockList = pagination.data.sort(
      (a, b) => b.stock_management_id - a.stock_management_id
    );
    setInboundData(sortedStockList);
  }, [pagination.data]);

  useEffect(() => {
    reloadTable(selectedWarehouse.current, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    fetchWarehouse();
  }, []);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  useEffect(() => {
    const filtered = inboundData.filter(
      (data) => data.product_list.product_category === "Raw Materials"
    );

    let finalFilteredData = filtered;

    // Filter by selected warehouse
    if (selectedWarehouse) {
      finalFilteredData = finalFilteredData.filter(
        (data) => data.warehouse.name === selectedWarehouse
      );
    }

    // Filter by search term
    if (searchTerm) {
      finalFilteredData = finalFilteredData.filter(
        (data) =>
          data.product_list.product_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          data.product_list.product_code
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          data.product_list.unit_of_measure
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(finalFilteredData);
  }, [inboundData, selectedWarehouse, searchTerm]);

  // useEffect(() => {
  //   const warehouses = inboundData.map((data) => data.warehouse.name);
  //   setWarehouseOptions([...new Set(warehouses)]);
  // }, [inboundData]);

  const columns = [
    {
      name: "Warehouse",
      selector: (row) => row.warehouseName,
    },
    {
      name: "Product Code",
      selector: (row) => row.productCode,
    },
    {
      name: "Name",
      selector: (row) => row.productName,
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
      name: "Total Stock",
      selector: (row) =>
        row.stock.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      name: "Average Price",
      selector: (row) =>
        row.averagePrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "N/A",
    },
  ];

  const handleRowClicked = (row) => {
    navigate(
      `/inventory/stockMangement/rawMaterialUpdate?productId=${row.productId}&warehouseId=${row.warehouseId}`
    );
  };

  const userData = inboundData.map((data, i) => ({
    key: i,
    stockManagementId: data?.stock_management_id,
    warehouseId: data?.warehouse_id,
    productId: data?.product_id,
    warehouseName: data?.warehouse?.name,
    productCode: data?.product_list?.product_code,
    productName: data?.product_list?.product_name,
    productCategory: data?.product_list?.product_category,
    uom: data?.product_list?.prod_packaging?.packaging_name,
    unit_quantity: data.product_list?.prod_packaging?.unit_quantity || 1,
    threshold: data?.product_list?.threshold,
    uncomputed_stock: data?.total_stock,
    averagePrice: data?.average_price,

    stock:
      data?.total_stock *
      (data?.product_list?.prod_packaging?.unit_quantity || 1),
  }));

  const handleWarehouseChange = (event) => {
    selectedWarehouse.current = event.target.value;
    reloadTable(event.target.value, searchTerm);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Update search term as the user types
    reloadTable(selectedWarehouse.current, event.target.value);
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
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
        <div className="col-sm mb-2">
          {/* <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchChange} // Update search term on change
            />
          </div> */}
        </div>
      </div>
      <div className="row mx-0 mt-2">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <li>
              <button
                className={`dropdown-item ${
                  filterColumn === "all" ? "active" : ""
                }`}
                onClick={() => setFilterColumn("all")}
              >
                All
              </button>
            </li>
            {[
              { value: "warehouse_name", label: "Warehouse" },
              { value: "product_code", label: "ID" },
              { value: "product_name", label: "Name" },
              { value: "unit_of_measure", label: "UOM" },
              { value: "threshold", label: "Threshold" },
              { value: "stock", label: "Stock Quantity" },
              { value: "average_price", label: "Average Price" },
            ].map(({ value, label }) => (
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
      </div>
      <div className="w-100 mt-3 container-fluid">
        <DataTable
          columns={columns}
          data={userData}
          customStyles={customStyles}
          onRowClicked={handleRowClicked}
        />
        <PaginationControls {...pagination} />
      </div>
    </div>
  );
}

export default RawMaterial;
