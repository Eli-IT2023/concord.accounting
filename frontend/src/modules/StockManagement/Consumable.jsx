import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { customStyles } from "../styles/table-style";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import { useServerPagination } from "../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../hooks/customHook/paginationHook/usePagination";
import { compactNumberFormat } from "../../utils/numberFormatter";

function Consumable() {
  const navigate = useNavigate();
  const userLoggedID = useDecodeToken();
  const [inboundData, setInboundData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // State to hold the search term
  const [filterColumn, setFilterColumn] = useState("all");
  const [totalQty, setTotalQty] = useState(0);
  const [overAllPrice, setOverAllPrice] = useState(0);

  const pagination = useServerPagination(
    BASE_URL + "/stockManagement/getStockManagement",
    10
  );

  const reloadTable = (id = null, searchText) => {
    pagination.updateParams({
      id,
      category: "Consumables",
      searchText,
      filterColumn,
    });
    // axios
    //   .get(BASE_URL + "/stockManagement/getStockManagement", {
    //     params: {
    //       id,
    //       category: "Consumables",
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

  console.log(pagination.data);

  useEffect(() => {
    const sortedStockList = pagination.data?.data?.sort(
      (a, b) => b.stock_management_id - a.stock_management_id
    );
    setInboundData(sortedStockList);
    handleSearch(searchTerm, sortedStockList);
  }, [pagination.data]);

  useEffect(() => {
    reloadTable(selectedWarehouse, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    setSearchTerm("");
  }, [filterColumn]);

  useEffect(() => {
    const filtered = inboundData?.filter(
      (data) => data.product_list.product_category === "Consumable"
    );

    let finalFilteredData = filtered;

    // Filter by selected warehouse
    if (selectedWarehouse) {
      finalFilteredData = finalFilteredData?.filter(
        (data) => data.warehouse.name === selectedWarehouse
      );
    }

    // Filter by search term
    if (searchTerm) {
      finalFilteredData = finalFilteredData?.filter(
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

  useEffect(() => {
    const warehouses = inboundData?.map((data) => data.warehouse.name);
    setWarehouseOptions([...new Set(warehouses)]);
  }, [inboundData]);

  const columns = [
    {
      name: "Warehouse",
      selector: (row) => row.warehouseName,
    },
    {
      name: "ID",
      selector: (row) => row.productCode,
    },
    {
      name: "Name",
      selector: (row) => <div className="text-center">{row.productName}</div>,
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
        row.stock.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "N/A",
    },
    {
      name: "Average Price",
      selector: (row) =>
        row.averagePrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "N/A",
    },
    {
      name: "Total Price",
      selector: (row) =>
        row.totalPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "N/A",
    },
  ];

  const handleRowClicked = (row) => {
    // navigate(
    //   `/inventory/stockMangement/rawMaterialUpdate/${row.stockManagementId}`
    // );
    if (userLoggedID === "11111111-1111-1111-1111-111111111111") {
      navigate(
        `/inventory/stockMangement/rawMaterialUpdate?productId=${row.productId}&warehouseId=${row.warehouseId}`
      );
    }
  };

  // const userData = filteredData.map((data, i) => ({
  //   key: i,
  //   stockManagementId: data.stock_management_id,
  //   warehouseName: data.warehouse.name,
  //   productCode: data.product_list.product_code,
  //   productName: data.product_list.product_name,
  //   productCategory: data.product_list.product_category,
  //   uom: data.product_list.unit_of_measure,
  //   threshold: data.product_list.threshold,
  //   stock: data.total_stock,
  //   averagePrice: data.average_price,
  // }));
  const userData = inboundData?.map((data, i) => ({
    key: i,
    stockManagementId: data.stock_management_id,
    warehouseId: data.warehouse_id,
    productId: data.product_id,
    warehouseName: data.warehouse.name,
    productCode: data.product_list.product_code,
    productName: data.product_list.product_name,
    productCategory: data.product_list.product_category,
    uom: data.product_list.unit_of_measure,
    threshold: data.product_list.threshold,
    stock: data.total_stock,
    averagePrice: data.average_price,
    totalPrice: data.totalPrice,
  }));

  const fetchStockManagementWidgets = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/stockManagement/getStockManagementWidgets`,
        {
          params: {
            category: "Consumables",
          },
        }
      );

      const totalQty = res.data.reduce(
        (sum, data) => sum + data.total_stock || 0,
        0
      );

      const overAllPrice = res.data.reduce(
        (sum, data) => sum + data.total_stock * data.average_price || 0,
        0
      );

      setTotalQty(totalQty);
      setOverAllPrice(overAllPrice);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (input, userData) => {
    // let input = e.target.value;

    // Remove commas
    const raw = String(input).replace(/,/g, "");

    const [intPart, decimalPart] = raw.split(".");

    // Add commas to integer part
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Join back decimal part if it exists
    const formatted =
      decimalPart !== undefined ? `${withCommas}.${decimalPart}` : withCommas;

    if (
      !raw.startsWith("0") &&
      userData?.find((item) => {
        const candidates = [
          item.totalPrice,
          item.average_price,
          item.total_stock,
        ];
        return candidates.some((value) => {
          if (typeof value !== "number" || isNaN(value) || Number(raw) === 0)
            return false;
          return (
            value.toPrecision(17).includes(raw) ||
            value.toFixed(17).includes(raw)
          );
        });
      })
    ) {
      setSearchTerm(formatted);
    } else {
      setSearchTerm(raw);
    }
  };

  useEffect(() => {
    fetchStockManagementWidgets();
  }, []);

  const handleWarehouseChange = (event) => {
    setSelectedWarehouse(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Update search term as the user types
  };

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="row">
        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title d-flex align-items-center justify-content-center">
                <i class="bx bx-package me-1 h-100"></i>
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
                {/* {totalQty ? compactNumberFormat(totalQty) : "0.00"} */}
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title d-flex align-items-center justify-content-center">
                <i class="bx bx-money me-1 h-100"></i>
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
                {/* {overAllPrice ? compactNumberFormat(overAllPrice) : "0.00"} */}
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
            value={selectedWarehouse}
          >
            <option value="">All Warehouse</option>
            {warehouseOptions.map((warehouse, index) => (
              <option key={index} value={warehouse}>
                {warehouse}
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
            onChange={(e) => {
              handleSearch(e.target.value, pagination.data.data);
            }}
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
              { value: "total_price", label: "Total Price" },
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

export default Consumable;

//  import React, { useState, useEffect, useRef } from "react";
// import DataTable from "react-data-table-component";
// import { customStyles } from "../styles/table-style";
// import BASE_URL from "../../assets/global/url";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// function Consumable() {
//   const navigate = useNavigate();
//   const [inboundData, setInboundData] = useState([]);
//   const [filteredData, setFilteredData] = useState([]);
//   // const [warehouseOptions, setWarehouseOptions] = useState([]);
//   // const [selectedWarehouse, setSelectedWarehouse] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [userLoggedID, setUserLoggedID] = useState([]);
//   const [filterColumn, setFilterColumn] = useState("all");

//   const decodeToken = () => {
//     var token = localStorage.getItem("accessToken");
//     if (typeof token === "string") {
//       var decoded = jwtDecode(token);
//       setUserLoggedID(decoded.id);
//     }
//   };

//   useEffect(() => {
//     decodeToken();
//   }, []);
//   const selectedWarehouse = useRef("");
//   const warehouseOptions = useRef([]);

//   const reloadTable = (id = null, searchText) => {
//     axios
//       .get(BASE_URL + "/stockManagement/getStockManagement", {
//         params: {
//           id,
//           category: "Consumables",
//           searchText,
//           filterColumn,
//         },
//       })
//       .then((res) => {
//         console.log(
//           "***************************************res.data: ",
//           res.data
//         );
//         const sortedStockList = res.data.sort(
//           (a, b) => b.stock_management_id - a.stock_management_id
//         );
//         console.log(sortedStockList, "sorted");
//         setInboundData(sortedStockList);
//         console.log(res.data);
//       })
//       .catch((err) => console.log(err));
//   };

//   const fetchWarehouse = async () => {
//     try {
//       const res = await axios.get(`${BASE_URL}/warehouse/getWarehouse`);
//       console.log(res.data);
//       warehouseOptions.current = res.data;
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   useEffect(() => {
//     fetchWarehouse();
//   }, []);

//   useEffect(() => {
//     reloadTable(selectedWarehouse.current, searchTerm);
//   }, [searchTerm]);

//   useEffect(() => {
//     setSearchTerm("");
//   }, [filterColumn]);

//   useEffect(() => {
//     const filtered = inboundData.filter(
//       (data) => data.product_list.product_category === "Consumables"
//     );

//     let finalFilteredData = filtered;

//     if (selectedWarehouse) {
//       finalFilteredData = finalFilteredData.filter(
//         (data) => data.warehouse.name === selectedWarehouse
//       );
//     }

//     // Filter by search term
//     if (searchTerm) {
//       finalFilteredData = finalFilteredData.filter(
//         (data) =>
//           data.product_list.product_name
//             .toLowerCase()
//             .includes(searchTerm.toLowerCase()) ||
//           data.product_list.product_code
//             .toLowerCase()
//             .includes(searchTerm.toLowerCase()) ||
//           data.product_list.unit_of_measure
//             .toLowerCase()
//             .includes(searchTerm.toLowerCase())
//       );
//     }

//     setFilteredData(finalFilteredData);
//   }, [inboundData, selectedWarehouse, searchTerm]);

//   // useEffect(() => {
//   //   const warehouses = inboundData.map((data) => data.warehouse.name);
//   //   setWarehouseOptions([...new Set(warehouses)]);
//   // }, [inboundData]);

//   const columns = [
//     {
//       name: "Warehouse",
//       selector: (row) => row.warehouseName,
//     },
//     {
//       name: "ID",
//       selector: (row) => row.productCode,
//     },
//     {
//       name: "Name",
//       selector: (row) => row.productName,
//     },
//     {
//       name: "Category",
//       selector: (row) => row.productCategory,
//     },
//     {
//       name: "UOM",
//       selector: (row) => row.uom,
//     },
//     {
//       name: "Threshold",
//       selector: (row) => row.threshold,
//     },
//     {
//       name: "Stock Quantity",
//       selector: (row) =>
//         row.stock.toLocaleString("en-US", {
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2,
//         }) || "N/A",
//     },
//     {
//       name: "Average Price",
//       selector: (row) =>
//         row.averagePrice.toLocaleString("en-US", {
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2,
//         }) || "N/A",
//     },
//   ];

//   const handleRowClicked = (row) => {
//     console.log(row);
//     if (userLoggedID === "11111111-1111-1111-1111-111111111111") {
//       navigate(
//         `/inventory/stockMangement/rawMaterialUpdate?productId=${row.productId}&warehouseId=${row.warehouseId}`
//       );
//     }
//   };

//   console.log(inboundData);

//   const userData = inboundData.map((data, i) => ({
//     key: i,
//     stockManagementId: data.stock_management_id,
//     warehouseId: data.warehouse_id,
//     productId: data.product_id,
//     warehouseName: data.warehouse.name,
//     productCode: data.product_list.product_code,
//     productName: data.product_list.product_name,
//     productCategory: data.product_list.product_category,
//     uom: data.product_list.unit_of_measure,
//     threshold: data.product_list.threshold,
//     stock: data.total_stock,
//     averagePrice: data.average_price,
//   }));

//   const handleWarehouseChange = (event) => {
//     selectedWarehouse.current = event.target.value;
//     reloadTable(event.target.value, searchTerm);
//   };

//   const handleSearchChange = (event) => {
//     setSearchTerm(event.target.value); // Update search term as the user types
//     reloadTable(selectedWarehouse.current, event.target.value);
//   };

//   return (
//     <div className="h-100 w-100 border bg-white custom-container">
//       <div className="w-100 row mx-0 mt-3">
//         <div className="col-sm mb-2">
//           <select
//             className="form-select"
//             onChange={handleWarehouseChange}
//             value={selectedWarehouse.current}
//           >
//             <option value="">All Warehouse</option>
//             {warehouseOptions.current.map((warehouse, index) => (
//               <option key={index} value={warehouse.warehouse_id}>
//                 {warehouse.name}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="col-sm text-end mb-2">
//           {/* <button
//             className="btn btn-secondary"
//             onClick={() => setSearchTerm("")}
//           >
//             Clear Filter
//           </button> */}
//         </div>
//         <div className="col-sm mb-2">
//           {/* <div className="input-group">
//             <input
//               type="text"
//               className="form-control"
//               placeholder="Search"
//               value={searchTerm}
//               onChange={handleSearchChange} // Update search term on change
//             />
//           </div> */}
//         </div>
//       </div>
//       <div className="row mx-0 mt-2">
//         <div className="input-group">
//           <input
//             type="text"
//             className="form-control"
//             placeholder="Search"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <button
//             type="button"
//             className="btn btn-outline-secondary dropdown-toggle-split"
//             data-bs-toggle="dropdown"
//             aria-expanded="false"
//           >
//             <i className="fa-solid fa-sliders"></i>
//           </button>
//           <ul className="dropdown-menu dropdown-menu-end">
//             <li>
//               <button
//                 className={`dropdown-item ${
//                   filterColumn === "all" ? "active" : ""
//                 }`}
//                 onClick={() => setFilterColumn("all")}
//               >
//                 All
//               </button>
//             </li>
//             {[
//               { value: "warehouse_name", label: "Warehouse" },
//               { value: "product_code", label: "ID" },
//               { value: "product_name", label: "Name" },
//               { value: "unit_of_measure", label: "UOM" },
//               { value: "threshold", label: "Threshold" },
//               { value: "stock", label: "Stock Quantity" },
//               { value: "average_price", label: "Average Price" },
//             ].map(({ value, label }) => (
//               <li key={value}>
//                 <button
//                   className={`dropdown-item ${
//                     filterColumn === value ? "active" : ""
//                   }`}
//                   onClick={() => setFilterColumn(value)}
//                 >
//                   {label}
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>
//       <div className="w-100 mt-3 container-fluid">
//         <DataTable
//           columns={columns}
//           data={userData}
//           pagination
//           customStyles={customStyles}
//           onRowClicked={handleRowClicked}
//         />
//       </div>
//     </div>
//   );
// }

// export default Consumable;
