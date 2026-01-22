import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { customStyles } from "../../../styles/table-style";
import BASE_URL from "../../../../assets/global/url";
import DataTable from "react-data-table-component";
import Nav from "react-bootstrap/Nav";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";

function OldRawMaterialUpdate() {
  const [key, setKey] = useState("rawMaterialStock");

  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const productId = queryParams.get("productId");
  const warehouseId = queryParams.get("warehouseId");

  const [stockManagement, setStockManagement] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [averagePrice, setAveragePrice] = useState(0);

  const fetchStockManagement = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/stockManagement/viewStockDetails`,
        {
          params: { productId, warehouseId },
        }
      );

      console.log(res.data.data.length);

      const { stockSum, priceSum, itemCount } = res.data.data.reduce(
        (acc, item) => {
          acc.stockSum += item.stock;
          acc.priceSum += item.price;
          acc.itemCount += 1;
          return acc;
        },
        { stockSum: 0, priceSum: 0, itemCount: 0 }
      );

      const calculatedTotalValue = (priceSum / itemCount) * stockSum;

      console.log(calculatedTotalValue);

      // const calculatedTotalValue = res.data.data?.reduce((acc, item) => {
      //   if (item.price > 0 && item.stock > 0) {
      //     return acc + item.price * item.stock;
      //   }
      //   return acc;
      // }, 0);
      const calculatedTotalQuantity = res.data.data?.reduce((acc, item) => {
        return acc + (item.stock > 0 ? item.stock : 0);
      }, 0);
      const calculatedAveragePrice =
        calculatedTotalQuantity > 0
          ? calculatedTotalValue / calculatedTotalQuantity
          : 0;

      console.log(calculatedTotalQuantity, "quantity");
      const consolidatedRows = Array.from(
        res.data.data
          ?.reduce((acc, item) => {
            if (!acc.has(item.warehouse.name)) {
              acc.set(item.warehouse.name, {
                ...item,
                stock: 0,
                price_in: 0,
                count: 0,
              });
            }
            const warehouseData = acc.get(item.warehouse.name);
            warehouseData.stock += item.stock;
            warehouseData.price_in += item.price_in;
            warehouseData.count += 1;
            return acc;
          }, new Map())
          .values()
      ).map((item) => ({
        ...item,
        price_in: item.price_in / item.count,
      }));

      // setStockManagement(consolidatedRows);
      setTotalQuantity(calculatedTotalQuantity);
      setTotalValue(calculatedTotalValue);
      setAveragePrice(calculatedAveragePrice);
    } catch (error) {
      console.error(error);
    }
  };

  const pagination = useServerPagination(
    `${BASE_URL}/stockManagement/viewStockDetailsTable`,
    10
  );

  useEffect(() => {
    pagination.updateParams({ productId, warehouseId });
    // axios
    //   .get(`${BASE_URL}/stockManagement/viewStockDetails`, {
    //     params: { productId, warehouseId },
    //   })
    //   .then((res) => {
    //     const calculatedTotalValue = res.data.reduce((acc, item) => {
    //       if (item.price > 0 && item.stock > 0) {
    //         return acc + item.price * item.stock;
    //       }
    //       return acc;
    //     }, 0);
    //     const calculatedTotalQuantity = res.data.reduce((acc, item) => {
    //       return acc + (item.stock > 0 ? item.stock : 0);
    //     }, 0);
    //     const calculatedAveragePrice =
    //       calculatedTotalQuantity > 0
    //         ? calculatedTotalValue / calculatedTotalQuantity
    //         : 0;
    //     const consolidatedRows = Array.from(
    //       res.data
    //         .reduce((acc, item) => {
    //           if (!acc.has(item.warehouse.name)) {
    //             acc.set(item.warehouse.name, {
    //               ...item,
    //               stock: 0,
    //               price_in: 0,
    //               count: 0,
    //             });
    //           }
    //           const warehouseData = acc.get(item.warehouse.name);
    //           warehouseData.stock += item.stock;
    //           warehouseData.price_in += item.price_in;
    //           warehouseData.count += 1;
    //           return acc;
    //         }, new Map())
    //         .values()
    //     ).map((item) => ({
    //       ...item,
    //       price_in: item.price_in / item.count,
    //     }));
    //     setStockManagement(consolidatedRows);
    //     setTotalQuantity(calculatedTotalQuantity);
    //     setTotalValue(calculatedTotalValue);
    //     setAveragePrice(calculatedAveragePrice);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching customer details: ", error);
    //   });
  }, [productId, warehouseId]);

  useEffect(() => {
    fetchStockManagement();
  }, []);

  useEffect(() => {
    if (pagination.data) {
      setStockManagement(pagination.data);
    }
  }, [pagination.data]);

  const columns = [
    {
      name: "ID",
      selector: (row) => row.product_list.product_code,
    },
    {
      name: "Product Name",
      selector: (row) => row.product_list.product_name,
    },
    {
      name: "Warehouse",
      selector: (row) => row.warehouse.name,
    },
    {
      name: "Quantity",
      selector: (row) =>
        row.totalStock?.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }),
    },
    {
      name: "Average Price",
      selector: (row) =>
        row.totalPrice
          ? row.totalPrice?.toLocaleString("en-US", {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            })
          : "0.00",
    },
  ];

  const userData = stockManagement.map((data, i) => ({
    key: i,
    productName: data.product_list.product_name,
    productCode: data.product_list.product_code,
    stockId: data.stock_management_id,
    warehouseName: data.warehouse.name,
    quantity: data.stock,
    price: data.price_in,
  }));

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
            <span>
              {stockManagement.length > 0
                ? stockManagement[0].product_list.product_name
                : "N/A"}
            </span>
          </div>
          <div className="col-md-3">
            <label className="text-muted d-block">Product Code</label>
            <span>
              {stockManagement.length > 0
                ? stockManagement[0].product_list.product_code
                : "N/A"}
            </span>
          </div>
          <div className="col-md-3">
            <label className="text-muted d-block">Product Category</label>
            <span>
              {stockManagement.length > 0
                ? stockManagement[0].product_list.product_category
                : "N/A"}
            </span>
          </div>
          <div className="col-md-3">
            <label className="text-muted d-block">UOM</label>
            <span>
              {stockManagement.length > 0
                ? stockManagement[0].product_list.unit_of_measure
                : "N/A"}
            </span>
          </div>
        </div>
        <hr />
        <div className="row">
          {/* <div className="col-md-2">
            <label className="text-muted d-block">Product Cost</label>
            <span>
              ₱{" "}
              {stockManagement.length > 0
                ? stockManagement[0].price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })
                : "N/A"}
            </span>
          </div> */}
          <div className="col-md-2">
            <label className="text-muted d-block">Average Price</label>
            <span>
              ₱{" "}
              {averagePrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="col-md-2">
            <label className="text-muted d-block">Average Total Value</label>
            <span>
              ₱{" "}
              {totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="col-md-2">
            <label className="text-muted d-block">Quantity</label>
            <span>
              {totalQuantity.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="col-md-2">
            <label className="text-muted d-block">Status</label>
            <span
              className={totalQuantity > 0 ? "text-success" : "text-danger"}
            >
              {totalQuantity > 0 ? "On stock" : "No Stock"}
            </span>
          </div>
        </div>
      </div>

      <Nav variant="tabs" activeKey={key} onSelect={(k) => setKey(k)}>
        <Nav.Item>
          <Nav.Link eventKey="rawMaterialStock">Stocks Transaction</Nav.Link>
        </Nav.Item>
        {/* <Nav.Item>
          <Nav.Link eventKey="newPurchase">New Purchase</Nav.Link>
        </Nav.Item> */}
        {/* <Nav.Item>
          <Nav.Link eventKey="newPurchase">Outbound Stocks</Nav.Link>
        </Nav.Item> */}
      </Nav>

      {key === "rawMaterialStock" && (
        <>
          <DataTable
            columns={columns}
            data={stockManagement}
            customStyles={customStyles}
          />
          <PaginationControls {...pagination} />
        </>
      )}
    </div>
  );
}

export default OldRawMaterialUpdate;
